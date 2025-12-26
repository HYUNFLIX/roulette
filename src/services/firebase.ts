/**
 * Firebase Service - Room management for participant registration
 */
import { initializeApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  push,
  onValue,
  remove,
  off,
  Database,
  DatabaseReference
} from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDPzf8pkqwAygJ7oPrIOv8x-2-ZPrDL7yk",
  authDomain: "marble-roulette.firebaseapp.com",
  databaseURL: "https://marble-roulette-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "marble-roulette",
  storageBucket: "marble-roulette.firebasestorage.app",
  messagingSenderId: "333788841940",
  appId: "1:333788841940:web:fb745d65ba50b4204bf841",
  measurementId: "G-HH5LHQ4EK4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database: Database = getDatabase(app);

// Generate random room code (6 characters)
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export interface Participant {
  id?: string;
  name: string;
  joinedAt: number;
}

export interface Room {
  code: string;
  createdAt: number;
  hostId: string;
  status: 'waiting' | 'playing' | 'finished';
  participants: { [key: string]: Participant };
}

class RoomService {
  private currentRoom: string | null = null;
  private participantsRef: DatabaseReference | null = null;
  private roomRef: DatabaseReference | null = null;
  private hostId: string;

  constructor() {
    // Generate unique host ID
    this.hostId = localStorage.getItem('mbr_hostId') || this.generateHostId();
    localStorage.setItem('mbr_hostId', this.hostId);
  }

  private generateHostId(): string {
    return 'host_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Create a new room
   */
  async createRoom(): Promise<string> {
    const code = generateRoomCode();
    const roomData: Room = {
      code,
      createdAt: Date.now(),
      hostId: this.hostId,
      status: 'waiting',
      participants: {}
    };

    await set(ref(database, `rooms/${code}`), roomData);
    this.currentRoom = code;
    return code;
  }

  /**
   * Join a room as participant
   */
  async joinRoom(code: string, name: string): Promise<{ success: boolean; error?: string }> {
    const roomRef = ref(database, `rooms/${code}`);

    return new Promise((resolve) => {
      onValue(roomRef, (snapshot) => {
        off(roomRef);

        if (!snapshot.exists()) {
          resolve({ success: false, error: '방을 찾을 수 없습니다.' });
          return;
        }

        const room = snapshot.val() as Room;

        if (room.status !== 'waiting') {
          resolve({ success: false, error: '이미 게임이 시작되었습니다.' });
          return;
        }

        // Add participant
        const participantRef = push(ref(database, `rooms/${code}/participants`));
        const participant: Participant = {
          name,
          joinedAt: Date.now()
        };

        set(participantRef, participant).then(() => {
          resolve({ success: true });
        }).catch((error) => {
          resolve({ success: false, error: error.message });
        });
      }, (error) => {
        resolve({ success: false, error: error.message });
      });
    });
  }

  /**
   * Listen to participants changes
   */
  onParticipantsChange(code: string, callback: (participants: Participant[]) => void): void {
    this.participantsRef = ref(database, `rooms/${code}/participants`);

    onValue(this.participantsRef, (snapshot) => {
      const data = snapshot.val();
      const participants: Participant[] = [];

      if (data) {
        Object.keys(data).forEach(key => {
          participants.push({
            id: key,
            ...data[key]
          });
        });
        // Sort by join time
        participants.sort((a, b) => a.joinedAt - b.joinedAt);
      }

      callback(participants);
    });
  }

  /**
   * Stop listening to participants
   */
  stopListening(): void {
    if (this.participantsRef) {
      off(this.participantsRef);
      this.participantsRef = null;
    }
    if (this.roomRef) {
      off(this.roomRef);
      this.roomRef = null;
    }
  }

  /**
   * Update room status
   */
  async setRoomStatus(code: string, status: 'waiting' | 'playing' | 'finished'): Promise<void> {
    await set(ref(database, `rooms/${code}/status`), status);
  }

  /**
   * Delete a room
   */
  async deleteRoom(code: string): Promise<void> {
    await remove(ref(database, `rooms/${code}`));
    this.currentRoom = null;
  }

  /**
   * Remove a participant
   */
  async removeParticipant(code: string, participantId: string): Promise<void> {
    await remove(ref(database, `rooms/${code}/participants/${participantId}`));
  }

  /**
   * Check if room exists and get its status
   */
  async getRoomStatus(code: string): Promise<{ exists: boolean; status?: string }> {
    return new Promise((resolve) => {
      const roomRef = ref(database, `rooms/${code}`);
      onValue(roomRef, (snapshot) => {
        off(roomRef);
        if (!snapshot.exists()) {
          resolve({ exists: false });
        } else {
          const room = snapshot.val();
          resolve({ exists: true, status: room.status });
        }
      });
    });
  }

  getCurrentRoom(): string | null {
    return this.currentRoom;
  }
}

export const roomService = new RoomService();

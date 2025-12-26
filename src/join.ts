/**
 * Join page script - Participant registration with confirmation step
 */
import { roomService } from './services/firebase';

document.addEventListener('DOMContentLoaded', () => {
  const roomCodeInput = document.getElementById('roomCode') as HTMLInputElement;
  const nameInput = document.getElementById('participantName') as HTMLInputElement;
  const nextBtn = document.getElementById('btnNext') as HTMLButtonElement;
  const backBtn = document.getElementById('btnBack') as HTMLButtonElement;
  const joinBtn = document.getElementById('btnJoin') as HTMLButtonElement;
  const btnText = document.getElementById('btnJoinText') as HTMLSpanElement;
  const btnSpinner = document.getElementById('btnJoinSpinner') as HTMLSpanElement;
  const errorMsg = document.getElementById('errorMsg') as HTMLDivElement;
  const confirmErrorMsg = document.getElementById('confirmErrorMsg') as HTMLDivElement;
  const joinForm = document.getElementById('joinForm') as HTMLDivElement;
  const successState = document.getElementById('successState') as HTMLDivElement;
  const registeredName = document.getElementById('registeredName') as HTMLParagraphElement;
  const roomCodeSection = document.getElementById('roomCodeSection') as HTMLDivElement;
  const inputStep = document.getElementById('inputStep') as HTMLDivElement;
  const confirmStep = document.getElementById('confirmStep') as HTMLDivElement;
  const confirmName = document.getElementById('confirmName') as HTMLParagraphElement;

  // Get room code from URL if provided
  const urlParams = new URLSearchParams(window.location.search);
  const roomFromUrl = urlParams.get('room');

  if (roomFromUrl) {
    roomCodeInput.value = roomFromUrl.toUpperCase();
    roomCodeSection.style.display = 'none';
  }

  // Auto uppercase room code
  roomCodeInput.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    target.value = target.value.toUpperCase();
  });

  // Show error on input step
  function showError(message: string) {
    errorMsg.textContent = message;
    errorMsg.classList.remove('hidden');
  }

  // Hide error on input step
  function hideError() {
    errorMsg.classList.add('hidden');
  }

  // Show error on confirm step
  function showConfirmError(message: string) {
    confirmErrorMsg.textContent = message;
    confirmErrorMsg.classList.remove('hidden');
  }

  // Hide error on confirm step
  function hideConfirmError() {
    confirmErrorMsg.classList.add('hidden');
  }

  // Set loading state
  function setLoading(loading: boolean) {
    joinBtn.disabled = loading;
    btnText.textContent = loading ? '등록 중...' : '참가하기';
    btnSpinner.classList.toggle('hidden', !loading);
  }

  // Show success
  function showSuccess(name: string) {
    joinForm.classList.add('hidden');
    successState.classList.remove('hidden');
    registeredName.textContent = name;
  }

  // Go to confirm step
  function goToConfirmStep() {
    hideError();

    const roomCode = roomCodeInput.value.trim().toUpperCase();
    const name = nameInput.value.trim();

    // Validation
    if (!roomCode || roomCode.length !== 6) {
      showError('올바른 방 코드를 입력해주세요. (6자리)');
      roomCodeInput.focus();
      return;
    }

    if (!name) {
      showError('이름을 입력해주세요.');
      nameInput.focus();
      return;
    }

    if (name.length > 20) {
      showError('이름은 20자 이내로 입력해주세요.');
      nameInput.focus();
      return;
    }

    // Show confirm step
    confirmName.textContent = name;
    inputStep.classList.add('hidden');
    confirmStep.classList.remove('hidden');
  }

  // Go back to input step
  function goToInputStep() {
    hideConfirmError();
    confirmStep.classList.add('hidden');
    inputStep.classList.remove('hidden');
    nameInput.focus();
  }

  // Handle join
  async function handleJoin() {
    hideConfirmError();

    const roomCode = roomCodeInput.value.trim().toUpperCase();
    const name = nameInput.value.trim();

    setLoading(true);

    try {
      const result = await roomService.joinRoom(roomCode, name);

      if (result.success) {
        showSuccess(name);
      } else {
        showConfirmError(result.error || '참가에 실패했습니다.');
      }
    } catch (error) {
      console.error('Join error:', error);
      showConfirmError('서버 연결에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  // Event listeners
  nextBtn.addEventListener('click', goToConfirmStep);
  backBtn.addEventListener('click', goToInputStep);
  joinBtn.addEventListener('click', handleJoin);

  // Enter key support
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      goToConfirmStep();
    }
  });

  roomCodeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (roomCodeInput.value.length === 6) {
        nameInput.focus();
      }
    }
  });

  // Focus name input if room code is pre-filled
  if (roomFromUrl) {
    nameInput.focus();
  }
});

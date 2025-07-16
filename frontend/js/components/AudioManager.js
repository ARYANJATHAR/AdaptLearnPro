// Audio Component
import { State } from './State.js';

export const AudioManager = {
    correctSound: null,
    incorrectSound: null,
    completionSound: null,
    
    init() {
        try {
            this.correctSound = new Audio('../assets/audio/correct.mp3');
            this.incorrectSound = new Audio('../assets/audio/wrong.mp3');
            this.completionSound = new Audio('../assets/audio/completion.mp3');
            return true;
        } catch (error) {
            console.error('Failed to initialize audio:', error);
            return false;
        }
    },
    
    playCorrect() {
        if (State.soundEnabled) {
            this.correctSound.currentTime = 0;
            this.correctSound.play().catch(e => console.log("Audio play error:", e));
        }
    },
    
    playIncorrect() {
        if (State.soundEnabled) {
            this.incorrectSound.currentTime = 0;
            this.incorrectSound.play().catch(e => console.log("Audio play error:", e));
        }
    },
    
    playCompletion() {
        if (State.soundEnabled) {
            this.completionSound.currentTime = 0;
            this.completionSound.play().catch(e => console.log("Audio play error:", e));
        }
    },
    
    toggleSound(soundToggle, showFeedback) {
        State.soundEnabled = !State.soundEnabled;
        soundToggle.innerHTML = State.soundEnabled ? 
            '<i class="fas fa-volume-up"></i>' : 
            '<i class="fas fa-volume-mute"></i>';
        
        showFeedback(State.soundEnabled ? "Sound On" : "Sound Off", "bg-blue-500");
    }
}; 
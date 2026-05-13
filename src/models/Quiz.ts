import Question from "./Question";
import Player from "./Player";
import { QuestionMode } from "../types/enum/QuestionMode";
import { GameMode } from "../types/enum/GameMode.ts";

export class Quiz {
    public isRunning: boolean = false;
    public questions: Question[] = [];
    public quizDuration: number = 0;
    public players: Player[] = [];
    private currentQuestionIndex: number = 0;
    private currentPlayerIndex: number = 0;
    private gameMode: GameMode = GameMode.Single;
    public questionMode: QuestionMode = QuestionMode.Custom;
    private numberOfPlayers: number = 1;
    private totalAmountOfQuestionToBeAsked: number = 0;
    private amountOfQuestionsAlreadyAsked: number = 0;

    public constructor(duration: number) { this.quizDuration = duration}

    public getGameMode():GameMode { return this.gameMode; }

    public getQuestionMode(): QuestionMode { return this.questionMode; }

    public getNumberOfPlayers(): number { return this.numberOfPlayers; }

    public getCurrentPlayerName(): string { return this.players[this.currentPlayerIndex].name; }

    public getCurrentQuestion() { return this.questions[this.currentQuestionIndex]; }
    
    public updateCurrentPlayerScore(amount: number) { this.players[this.currentPlayerIndex].score += amount}
    
    public setQuestionMode(mode: QuestionMode) { this.questionMode = mode }

    private updateTotalAmountOfQuestionToBeAsked( ) { return this.totalAmountOfQuestionToBeAsked = this.quizDuration*this.getAmountOfPlayers()}

    public addQuestion(q: Question) { return this.questions.push(q) }

    public addPlayer(name: string) { return this.players.push(new Player(name))}

    private getAmountOfPlayers() { return this.numberOfPlayers }

    public removePlayer(name : string) { return this.players = this.players.filter(player => name !== player.name )}

    public startQuiz() { 
        this.isRunning = true;
        
        this.updateTotalAmountOfQuestionToBeAsked();
        this.shuffleAnswersInQuestions();
    }

    public testIfAnswerIsCorrect(answer: string) {     
        let correctAnswer = this.questions[this.currentQuestionIndex].answers.find(a => a.isCorrect)!;

        return correctAnswer.text === answer;
     }

    public nextQuestion() { 
        this.amountOfQuestionsAlreadyAsked++;

        if(this.amountOfQuestionsAlreadyAsked === this.totalAmountOfQuestionToBeAsked)
        {
            this.endQuiz();
            return;
        }

        this.currentQuestionIndex++;

        if(this.amountOfQuestionsAlreadyAsked % this.questions.length === 0)
        {
            this.currentPlayerIndex++;
            this.currentQuestionIndex = 0;
            return;
        }

        if(this.currentQuestionIndex === this.questions.length -1)
        {
            this.currentQuestionIndex = 0;
            return;
        }

    }

    private shuffleAnswersInQuestions() {return this.questions.forEach(question => question.answers.sort(() => Math.random()))}

    private endQuiz() { 
        this.isRunning = false;
        return this.sortPlayersByScore();
    }

    public setGameMode(gameMode: GameMode, amountOfPlayers: number) { 
        this.gameMode = gameMode;
        this.numberOfPlayers = (gameMode === GameMode.Single) ? 1 : amountOfPlayers
    }

    public sortPlayersByScore() { return this.players.sort((a, b) => b.score - a.score)}

    public resetGame() { 
        this.isRunning = false;
        this.questions = [];
        this.quizDuration= 0;
        this.players = [];
        this.currentQuestionIndex = 0;
        this.currentPlayerIndex = 0;
        this.gameMode = GameMode.Single;
        this.questionMode = QuestionMode.Custom;
        this.numberOfPlayers = 1;
        this.totalAmountOfQuestionToBeAsked = 0;
        this.amountOfQuestionsAlreadyAsked = 0;
        this.players.forEach(player => player.score = 0)
    }
}

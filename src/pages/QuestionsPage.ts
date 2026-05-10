import { quiz, quizPage } from "../globals.ts";
import { QuestionMode } from "../types/enum/QuestionMode.ts";
import { QuestionService } from "../services/QuestionService.ts";
import { ICategory } from "../types/interfaces/ICategory.ts";
import { Difficulty } from "../types/enum/Difficulty.ts";
import { disableEl, displayAlert, enableEl, getElementWrapper } from "../utils";
import Question from "../models/Question.ts";
import {c} from "vite/dist/node/types.d-aGj9QkWt";

const questionService = new QuestionService();

const fillCategories = async () => {
    const select = getElementWrapper<HTMLSelectElement>('#input-category');
    const categories = await questionService.getCategories() ?? [];

    categories.forEach((c: ICategory) => {
        const option = document.createElement("option");
        option.value = c.id.toString();
        option.text = c.name;
        select.appendChild(option);
    });
}

const fillDifficulty = async () => {
    const select = getElementWrapper<HTMLSelectElement>('#input-difficulty');

    Object.keys(Difficulty).forEach(key => {
        const option = document.createElement("option");
        option.value = key.toLowerCase();
        option.text = key;
        select.appendChild(option);
    });
};



export class QuestionsPage {
    public constructor() {

    }

    public async init(contentElement: HTMLElement) {

        // language=HTML
        const apiModeHtml: string = `
            <h2>API questions</h2>
            <p>Configure the API for retrieving questions</p>
            <select class="form-select" id="input-difficulty" data-testid="input-difficulty">${fillDifficulty()}</select>
            <select class="form-select mt-2" id="input-category" data-testid="input-category">${fillCategories()}</select>
            <button id="btn-fetch-questions" class="btn btn-primary mt-2" data-testid="btn-fetch-questions">Fetch questions</button>
        `;

        const customModeHtml: string = `
            <h2>Custom questions</h2>
            <div class="row mb-3">
                <label for="input-question" class="col-sm-2 col-form-label">Question</label>
                <div class="col-sm-10">
                    <input class="form-control" id="input-question" data-testid="input-question">
                </div>
            </div>
            <div class="row mb-3">
                <label for="input-correct-answer" class="col-sm-2 col-form-label">Correct answer</label>
                <div class="col-sm-10">
                    <input class="form-control" id="input-correct-answer" data-testid="input-correct-answer">
                </div>
            </div>
            <div class="row mb-3">
                <label for="input-incorrect-answer" class="col-sm-2 col-form-label">Incorrect answer</label>
                <div class="col-sm-10">
                    <div class="input-group">
                        <input id="input-incorrect-answer" type="text" class="form-control" aria-label="Recipient's username"
                            aria-describedby="button-addon2" data-testid="input-incorrect-answer">
                        <button class="btn btn-outline-secondary" type="button" id="btn-add-incorrect-answer" data-testid="btn-add-incorrect-answer">Add</button>
                    </div>
                </div>
            </div>
            <table class="table table-bordered">
                <thead>
                <tr>
                    <th scope="col">Question</th>
                    <th scope="col">Correct answer</th>
                    <th scope="col">Incorrect answers</th>
                </tr>
                </thead>
                <tbody>
                <tr>
                    <td id="output-question" data-testid="output-question"></td>
                    <td>
                        <ul id="output-correct-answer" data-testid="output-correct-answer">
                        </ul>
                    </td>
                    <td>
                        <ul id="output-incorrect-answers" data-testid="output-incorrect-answers">
                        </ul>
                    </td>
                </tr>
                </tbody>
            </table>
            <button type="submit" class="btn btn-primary" id="btn-submit-question" data-testid="btn-submit-question">Submit question</button>
        `;

        let htmlToShow = quiz.getQuestionMode() === QuestionMode.Api ? apiModeHtml : customModeHtml;
        
        const questionsHtml: string = `
            <h2 class="mt-2">Confirmed questions <span id="question-counter" data-testid="question-counter">(${quiz.questions.length}/${quiz.quizDuration})</span></h2>
            <div id="questions" data-testid="questions">No questions to display</div>
        `;

        const fullHtml = `
            <div class="row">
                <div class="col">
                    <p data-testid="intro">A quiz can not start without questions. Add questions to the quiz by fetching them from an API or by adding them manually.</p>
                </div>
            </div>
            <div class="row">
                <div class="col">${htmlToShow}</div>
                <div class="col">${questionsHtml}</div>
            </div>
            <hr>
            <div class="row">
                <div class="col">
                    <button class="btn btn-success w-100" id="btn-start-quiz" data-testid="btn-start-quiz" disabled>Start quiz</button>
                </div>
            </div>
        `;
        
        contentElement.innerHTML = fullHtml;

        if(quiz.getQuestionMode() === QuestionMode.Api) {
            await this.addAPIQuestions();
        }
        else {
           this.addFreeInputQuestions();
        }
    }

    private async addAPIQuestions() {
        await fillCategories();
        await fillDifficulty();

        let selectedDifficulty: string = getElementWrapper<HTMLButtonElement>('#input-difficulty')!.value;
        let selectedCategory: string = getElementWrapper<HTMLSelectElement>("#input-category")!.value;

        getElementWrapper<HTMLButtonElement>('#input-difficulty').addEventListener("change", () => {selectedDifficulty = getElementWrapper<HTMLSelectElement>("#input-difficulty")!.value;});
        getElementWrapper<HTMLButtonElement>('#input-category').addEventListener("change", () => {selectedCategory = getElementWrapper<HTMLSelectElement>("#input-category")!.value;});

        getElementWrapper<HTMLButtonElement>('#btn-fetch-questions').addEventListener("click", async () => {
            const questionsAsIApiQuestions = await questionService.getQuestions(quiz.quizDuration, Number(selectedCategory), selectedDifficulty) ?? [];

            //IApiQuestion[] naar Question[]
            questionsAsIApiQuestions.forEach(q => {
                let questionAsQuestion: Question = new Question(q.question);

                questionAsQuestion.addAnswer({text: q.correct_answer, isCorrect: true})

                q.incorrect_answers.forEach((answer) => {
                    questionAsQuestion.addAnswer({text: answer, isCorrect: false})
                })

                quiz.addQuestion(questionAsQuestion);
            })

            this.renderQuestions();
            this.updateQuestionCounter();

            setTimeout(() => {
                this.startQuiz();
            }, 2000);
        });
    }

    private addFreeInputQuestions() {
        let inputQuestion = document.querySelector<HTMLInputElement>('#input-question')!;
        let inputCorrectAnswer = document.querySelector<HTMLInputElement>('#input-correct-answer')!;
        let inputIncorrectAnswer = document.querySelector<HTMLInputElement>('#input-incorrect-answer')!;
        let btnAddIncorrectAnswer= document.querySelector<HTMLButtonElement>('#btn-add-incorrect-answer')!;
        let btnSubmitQuestion = document.querySelector<HTMLButtonElement>('#btn-submit-question')!;

        let arrayIncorrectAnswers : string[] = [];

        let outputQuestion = getElementWrapper<HTMLTableCellElement>("#output-question")!;
        let outputCorrectAnswer = getElementWrapper<HTMLTableCellElement>("#output-correct-answer");
        let outputIncorrectAnswers = getElementWrapper<HTMLTableCellElement>("#output-incorrect-answers");

        inputQuestion.addEventListener("input", () => {outputQuestion.innerText = inputQuestion.value});
        inputCorrectAnswer.addEventListener("input", () => {outputCorrectAnswer.innerText = inputCorrectAnswer.value});

        btnAddIncorrectAnswer.addEventListener("click", () => {
            if(inputIncorrectAnswer.value.trim() === "" || inputIncorrectAnswer.value === undefined){
                displayAlert("Incorrect answer can not be empty");
            }
            else {
                let li = document.createElement('li');
                li.innerText = inputIncorrectAnswer.value;

                outputIncorrectAnswers.appendChild(li);
                arrayIncorrectAnswers.push(inputIncorrectAnswer.value);

                inputIncorrectAnswer.value = "";
            }

        })

        btnSubmitQuestion.addEventListener("click", () => {
            let question = new Question("");
            const wordCount = inputQuestion.value.trim().split(/\s+/).length;

            if(wordCount < 5) {
                console.log(wordCount);
                displayAlert("Question should contain at least 4 words");
                return;
            }

            if(inputCorrectAnswer.value.trim() === "" || inputCorrectAnswer.value === undefined) {
                displayAlert("Question should contain at least 1 correct answer which can not be empty")
                return;
            }

            if(arrayIncorrectAnswers.length< 1) {
                displayAlert("Question should contain at least 1 incorrect answers");
                return;
            }

            question.question = inputQuestion.value;
            question.addAnswer({text: inputCorrectAnswer.value, isCorrect: true});

            arrayIncorrectAnswers.forEach((incorrectAnswer) => {
                question.addAnswer({text: incorrectAnswer, isCorrect: false})
            })

            quiz.addQuestion(question);

            this.renderQuestions();
            this.updateQuestionCounter();

            //Resetten
            inputQuestion.value = "";
            inputCorrectAnswer.value = "";
            inputIncorrectAnswer.value = "";
            outputQuestion.innerText = "";
            outputCorrectAnswer.innerText = "";
            outputIncorrectAnswers.innerText = "";
            arrayIncorrectAnswers = [];
            question = new Question("");

            this.startQuiz();
        })
    }

    private renderQuestions() {
        const questionsArray = getElementWrapper<HTMLDivElement>('#questions');
        let ul = document.createElement('ul');

        if(questionsArray !== null)
        {
            questionsArray.innerText = "";

            quiz.questions!.forEach(p => {
                let li = document.createElement('li');
                li.innerText = p.toString();
                ul.appendChild(li);
            });

            questionsArray.appendChild(ul);
        }
    }

    private updateQuestionCounter() {
        let amountOfQuestions = document.querySelector<HTMLSpanElement>("#question-counter")!;

        amountOfQuestions.innerText = `(${quiz.questions.length}/${quiz.quizDuration})`;
    }

    private startQuiz() {
        let quizQuestionsCount = 0;
        quiz.questions.forEach(() => {quizQuestionsCount++})

        if(quiz.questions.length === quiz.quizDuration) {
            if(quiz.getQuestionMode() === QuestionMode.Api) {
                const btnFetchQuestion = getElementWrapper<HTMLButtonElement>('#btn-fetch-questions');
                disableEl(btnFetchQuestion);
            }
            else {
                const btnSubmitQuestion =  getElementWrapper<HTMLButtonElement>('#btn-submit-question');
                disableEl(btnSubmitQuestion);
            }

            const startQuiz = getElementWrapper<HTMLButtonElement>('#btn-start-quiz');
            enableEl(startQuiz);

            startQuiz.addEventListener("click", async () => {
                await quiz.startQuiz();
                quizPage.init(getElementWrapper<HTMLDivElement>('#content'))
            });
        }
    }
}
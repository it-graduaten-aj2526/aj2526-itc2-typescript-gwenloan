import Question from "../models/Question";
import { IApiQuestion } from "../types/interfaces/IApiQuestion.ts";
import { displayAlert } from "../utils";
import {ICategory} from "../types/interfaces/ICategory.ts";

export class QuestionService {
    baseUrl: string = 'https://opentdb.com/api.php?'
    categoryUrl: string = 'https://opentdb.com/api_category.php'

    constructor() {
    }

    getCategories = async () => {
        try {
            const result = await fetch(this.categoryUrl);
            const { trivia_categories } = await result.json();

            return trivia_categories as ICategory[];
        }
        catch (error) {
            console.error(error);
        }
    }

    getQuestions = async (amount: number, category: number, difficulty: string) => {
        //https://opentdb.com/api.php?amount=10&category=26&difficulty=medium

        const getQuestionsUrl : string = this.baseUrl + `amount=${amount}&category=${category}&difficulty=${difficulty}`;

        try {
            const result = await fetch(getQuestionsUrl);

            const {results} = await result.json();

            return results as IApiQuestion[];
        }
        catch (error) {
            console.error(error);
        }
    }

    mapQuestionsToQuestionModel = (questions: IApiQuestion[]): Question[] => {

        let questionList: Question[] = [];

        for (const q of questions) {
            const question = new Question(q.question);
            question.addAnswer({ text: q.correct_answer, isCorrect: true });
            q.incorrect_answers.forEach(a => question.addAnswer({ text: a, isCorrect: false }));
            questionList.push(question);
        }

        return questionList;
    }
}
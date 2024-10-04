import { collections } from "../db";
import { UserScenarioModel } from "../models";
import { createDiscussion } from "../models/forum";
import { UserScenario } from "../types";
import { Request, Response } from "express";

export type UserScenarioCreate = {
    token: string;
    id: number;                 // the idea id
    content: UserScenario;
}

export const userScenarioToMarkdown = (userScenario: UserScenario): string => {
    let steps = '';
    userScenario.context.steps.forEach((step) => {
        steps += `    * ${step}\n`
    })
    let habits = '';
    userScenario.relevant_habits_hobbies_beliefs.forEach((habits) => {
        habits += `    * ${habits}\n`
    })

    let goals = '';
    userScenario.goals.forEach(goal => {
        goals += `- ${goal}\n`;
    })

    let problems = '';
    userScenario.problems.forEach(problem => {
        problems += `
* **Description**: ${problem.description}\n
* **Obstacles**: \n`
        problem.obstacles.forEach(obstacle => {
            problems += `
   - ${obstacle}\n`
        })

        problems += "\n\n"
    })

    let flow = '';
    userScenario.user_scenario_flow.forEach(step => {
        flow += `
* **${step.action}**: ${step.description}\n`
    })

    let html = `
## Context\n
\n
- **User**: ${userScenario.context.user}\n
- **Background**: ${userScenario.context.background}\n
- **Steps**:\n
${steps}\n
\n\n
- **Habits**:\n
${habits}\n
\n\n
## Goals\n
\n
${goals}\n
\n\n
## Problems\n
\n
${problems}\n
\n\n
## User Scenario Flow\n
\n\n
${flow}
`;

    return html;
}

/**
 * GET /aurora/user-scenarios returns the list of the user scenarios
 * @param req 
 * @param res 
 * @returns 
 */
export const onUserScenarios = async (req: Request, res: Response) => {
    let cursor = collections.user_scenarios?.find({}).sort( { forum_discussion_id: -1 } );
    let result = await cursor?.toArray();

    if (result === undefined || result.length == 0) {
        return res.json([]);
    }
    let rows = result as UserScenarioModel[];
    return res.json(rows);
}

/**
 * /POST /aurora/user-scenario creates a new user scenario
 * @param req 
 * @param res 
 * @returns 
 */
export const onUserScenarioCreate = async (req: Request, res: Response) => {
    const data = req.body as UserScenarioCreate;
    if (!data) {
        return res.status(400).json({message: 'missing UserScenarioCreate body parameters'});
    }

    let content = userScenarioToMarkdown(data.content);
    if (!content) {
        return res.status(400).json({message: 'failed to convert user scenario into a forum post'});
    }

    console.log(`Todo: store the user scenario in the Ara Server in the UserScenario type along with forum id`);
    console.log(`Todo: the forum id is for the future, when we want to edit the scenario`);

    const post = await createDiscussion(data.token, data.content.title, content, process.env.ARA_AURORA_TAG_ID!);
    if (typeof(post) === 'string') {
        return res.status(400).json({message: post})
    }

    const model = data.content as UserScenarioModel;
    model.forum_username = post.relationships.user?.attributes.username!;
    model.forum_discussion_id = post.id;
    model.forum_created_at = post.relationships.firstPost?.attributes.createdAt!;
    model.forum_user_id = post.relationships.user?.id! as number;
    model.logos_id = data.id;

    // put the data
    try {
        const dbResult = await collections.user_scenarios?.insertOne(model);

        if (!dbResult) {
            return res.status(500).json({message: 'Failed to insert the user scenario in the database'});
        }
    } catch (error) {
        return res.status(500).json({message: JSON.stringify(error)});
    } 

    return res.json(post);
}
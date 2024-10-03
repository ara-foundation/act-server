/**
 * This module is to test the Ara Server as a client. Useful to test POST methods
 */
import 'dotenv/config';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { UserCreate } from '../src/handlers/users';
import { AraDiscussion, AraUser, UserScenario } from '../src/types';
import { CreateSessionToken } from '@ara-foundation/flarum-js-client';
import { IdeaCreate } from '../src/handlers/logos';
import { UserScenarioCreate } from '../src/handlers/aurora';

const port = process.env.PORT || 3000;
const url = `http://localhost:${port}`;

const sampleIdeaId = 76;
const sampleUserScenario: UserScenario = {
  "title": "sample_idea_user_scenario",
  "context": {
      "user": "John Doe",
      "background": "John is a busy professional who travels frequently for work.",
      "steps": [
          "John realizes he needs to book a flight for his next business trip.",
          "He opens his laptop and searches for travel booking websites.",
          "He lands on your travel booking website."
      ]
  },
  "goals": [
      "Book a flight for his upcoming business trip.",
      "Find the best deal available.",
      "Complete the booking process quickly and efficiently."
  ],
  "problems": [
      {
          "description": "John finds it difficult to compare prices across different airlines.",
          "obstacles": [
              "Time-consuming process of visiting multiple websites.",
              "Confusing layouts and lack of clear price comparison tools."
          ]
      },
      {
          "description": "John often encounters hidden fees and charges during the booking process.",
          "obstacles": [
              "Lack of transparency in pricing.",
              "Unexpected additional costs at checkout."
          ]
      }
  ],
  "user_motivations": [
      "Save time by using a single platform for booking.",
      "Save money by finding the best deals.",
      "Avoid the hassle of hidden fees and charges."
  ],
  "personal_traits": [
      "John is tech-savvy and prefers using online platforms for his travel needs.",
      "He values efficiency and convenience in his daily tasks.",
      "He is budget-conscious and always looks for the best value for his money."
  ],
  "relevant_habits_hobbies_beliefs": [
      "John frequently travels for business and leisure.",
      "He enjoys exploring new places and cultures.",
      "He believes in the importance of planning ahead to avoid last-minute stress."
  ],
  "user_scenario_flow": [
      {
          "step": 1,
          "action": "Visit the travel booking website.",
          "description": "John navigates to the homepage of the travel booking website."
      },
      {
          "step": 2,
          "action": "Search for flights.",
          "description": "John enters his travel details and searches for available flights."
      },
      {
          "step": 3,
          "action": "Compare prices.",
          "description": "John uses the price comparison tool to find the best deal."
      },
      {
          "step": 4,
          "action": "Select a flight.",
          "description": "John selects the flight that best fits his schedule and budget."
      },
      {
          "step": 5,
          "action": "Complete the booking process.",
          "description": "John enters his personal and payment information to finalize the booking."
      },
      {
          "step": 6,
          "action": "Receive confirmation.",
          "description": "John receives a confirmation email with his booking details."
      }
]};


const createUser = async(body: UserCreate): Promise<string|AraUser> => {
    let urlToGo = url + '/users';
    console.log(`Url to go ${urlToGo}`);
    const response = await fetch(urlToGo, {
        headers: {
            'Content-Type': `application/json`,
        },
        method: "POST",
        body: JSON.stringify(body),
    })

    if (!response.ok) {
        console.log(await response.json());
        console.log(JSON.stringify(body));
        return `Response Status ${response.status}: ${response.statusText}`;
    }

    try {
        const json = await response.json();
        return json as AraUser;
    } catch (e) {
        return JSON.stringify(e);
    }
}

const createSessionToken = async(body: UserCreate): Promise<string|CreateSessionToken> => {
  let urlToGo = url + '/users/login';
  console.log(`Url to go ${urlToGo}`);
  const response = await fetch(urlToGo, {
      headers: {
          'Content-Type': `application/json`,
      },
      method: "POST",
      body: JSON.stringify(body),
  })

  if (!response.ok) {
    console.log(`Failed to login`);
      console.log(await response.json());
      console.log(JSON.stringify(body));
      return `Response Status ${response.status}: ${response.statusText}`;
  }

  try {
      const json = await response.json();
      return json as CreateSessionToken;
  } catch (e) {
      return JSON.stringify(e);
  }
}

const createIdea = async(body: IdeaCreate): Promise<string|CreateSessionToken> => {
  let urlToGo = url + '/logos/idea';
  console.log(`Url to go ${urlToGo}`);
  const response = await fetch(urlToGo, {
      headers: {
          'Content-Type': `application/json`,
      },
      method: "POST",
      body: JSON.stringify(body),
  })

  if (!response.ok) {
    console.log(`Failed to create idea`);
      console.log(await response.json());
      console.log(JSON.stringify(body));
      return `Response Status ${response.status}: ${response.statusText}`;
  }

  try {
      const json = await response.json();
      return json as CreateSessionToken;
  } catch (e) {
      return JSON.stringify(e);
  }
}

yargs(hideBin(process.argv))
  .command('create-user [username] [password] [email]', 'Registers the user on ara forum', (yargs) => {
    return yargs
      .positional('email', {
        describe: 'email of the user',
      })
      .positional('username', {
        describe: 'username without any space or special character',
      })
      .positional('password', {
        describe: 'password of the user',
      })
  }, async (argv) => {
    if (argv.verbose) console.info(`creating ${argv.username} user...`)
    
    const res = await createUser(argv as UserCreate)
    if (typeof(res) === 'string') {
        console.error(res);
    } else {
        console.log(`User was created!`);
        console.log(res);
    }
  })
  .command('login-user [username] [password]', 'Logins and returns the session token from ara forum', (yargs) => {
    return yargs
      .positional('username', {
        describe: 'username without any space or special character',
      })
      .positional('password', {
        describe: 'password of the user',
      })
  }, async (argv) => {
    if (argv.verbose) console.info(`logging in as ${argv.username} user...`)

    const userParams: UserCreate = {
      email: "not_used@vladlena.love.you",
      username: argv.username as string,
      password: argv.password as string,
    }
    
    const res = await createSessionToken(userParams)
    if (typeof(res) === 'string') {
        console.error(res);
    } else {
        console.log(`Logged in!`);
        console.log(res);
    }
  })
  .command('post-idea [token] [title] [content]', 'Post your idea', (yargs) => {
    return yargs
      .positional('token', {
        describe: 'yout session token to authenticate',
      })
      .positional('title', {
        describe: 'Title of the idea',
      })
      .positional('content', {
        describe: 'A details of the idea. Supports encoded HTML',
      })
  }, async (argv) => {
    if (argv.verbose) console.info(`logging in as ${argv.username} user...`)

    const res = await createIdea(argv as IdeaCreate)
    if (typeof(res) === 'string') {
        console.error(res);
    } else {
        console.log(`Idea post created!`);
        console.log(res);
    }
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Run with verbose logging'
  })
  .parse()

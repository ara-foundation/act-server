/**
 * This module is to test the Ara Server as a client. Useful to test POST methods
 */
import 'dotenv/config';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { UserCreate } from '../src/handlers/users';
import { AraUser } from '../src/types';
import { CreateSessionToken } from '@ara-foundation/flarum-js-client';
import { IdeaCreate } from '../src/handlers/logos';

const port = process.env.PORT || 3000;
const url = `http://localhost:${port}`;


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

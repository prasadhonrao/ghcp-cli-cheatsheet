import type { Command } from '../types';

import gettingStarted from './categories/getting-started.json';
import authentication from './categories/authentication.json';
import chat from './categories/chat.json';
import models from './categories/models.json';
import configuration from './categories/configuration.json';
import code from './categories/code.json';
import agents from './categories/agents.json';
import mcp from './categories/mcp.json';
import memory from './categories/memory.json';
import instructions from './categories/instructions.json';
import troubleshooting from './categories/troubleshooting.json';

const commands: Command[] = [
  ...(gettingStarted as Command[]),
  ...(authentication as Command[]),
  ...(chat as Command[]),
  ...(models as Command[]),
  ...(configuration as Command[]),
  ...(code as Command[]),
  ...(agents as Command[]),
  ...(mcp as Command[]),
  ...(memory as Command[]),
  ...(instructions as Command[]),
  ...(troubleshooting as Command[]),
];

export default commands;

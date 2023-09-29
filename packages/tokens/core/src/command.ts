import type { Container, MultiTokenInterface, Provider } from '@tinkoff/dippy';
import { createToken } from '@tinkoff/dippy';

const multiOptions = { multi: true } as const;

export type Command = () => any;

export interface CommandLineRunner {
  lines: CommandLines;

  run(
    type: keyof CommandLines,
    status: keyof CommandLineDescription,
    providers?: Provider[],
    customDi?: Container,
    key?: string | number
  ): Promise<Container>;
}

export type CommandLineDescription = Record<string, MultiTokenInterface<Command>[]>;

export type CommandLines = {
  server: CommandLineDescription;
  client: CommandLineDescription;
};

export const COMMAND_LINE_RUNNER_TOKEN = createToken<CommandLineRunner>('commandLineRunner');
export const COMMAND_LINES_TOKEN = createToken<CommandLines>('commandLines');

export const commandLineListTokens = {
  // Block: Initializing
  init: createToken<Command>('init', multiOptions),
  listen: createToken<Command>('listen', multiOptions),

  // Block: Request handling
  customerStart: createToken<Command>('customer_start', multiOptions), // Client initialization
  resolveUserDeps: createToken<Command>('resolve_user_deps', multiOptions), // Get the client data
  resolvePageDeps: createToken<Command>('resolve_page_deps', multiOptions), // Get the page data
  generatePage: createToken<Command>('generate_page', multiOptions), // Generate html for the page
  clear: createToken<Command>('clear', multiOptions), // Cleanup

  // Block: Client navigations
  spaTransition: createToken<Command>('spa_transition', multiOptions),
  afterSpaTransition: createToken<Command>('after_spa_transition', multiOptions),

  // Block: Server stop
  close: createToken<Command>('close', multiOptions),
};

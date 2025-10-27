import { logger, LoggerClient } from "./logger";
import { EmailServer, initEmailServer } from "./mail_server";

export class Infrastructure {
    logger: LoggerClient;
    emailServer: EmailServer;

    constructor(dependencies: { logger: LoggerClient; emailServer: EmailServer }) {
        this.logger = dependencies.logger;
        this.emailServer = dependencies.emailServer;
    }
}

export async function initInfrastructure(): Promise<Infrastructure> {
    const emailServer = await initEmailServer(logger);

    return new Infrastructure({
        logger: logger,
        emailServer: emailServer,
    });
}

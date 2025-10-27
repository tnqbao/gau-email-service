import { logger, LoggerClient } from "./logger";

export class Infrastructure {
    logger: LoggerClient;

    constructor(dependencies: { logger: LoggerClient }) {
        this.logger = dependencies.logger;
    }
}

export async function initInfrastructure() {
    return new Infrastructure({
        logger: logger,
    });
}

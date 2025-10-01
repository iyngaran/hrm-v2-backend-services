import { Params } from 'nestjs-pino';
import * as path from 'path';
import { BaseEnv } from '../env/base.env';
import { GenericConfigService } from '../generic-config.service';

export const getPinoConfig = (env: GenericConfigService<BaseEnv>): Params => {
  // Generate log file name with current date (YYYY-MM-DD)
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const logFileName = `${yyyy}-${mm}-${dd}.log`;
  const logFilePath = path.join('./logs/user-service', logFileName);

  return {
    pinoHttp: {
      enabled: env.get('LOGGER_ENABLE'),
      level: env.get('LOGGER_DEFAULT_LEVEL'),
      transport: {
        targets: [
          ...(env.get('LOGGER_CONSOLE_TARGET_ENABLE')
            ? [
                {
                  target: 'pino-pretty',
                  level: env.get('LOGGER_CONSOLE_LEVEL'),
                  options: {
                    colorize: true,
                    translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
                    singleLine: true,
                    messageFormat: '{context}: {msg}',
                    ignore: 'pid,hostname,req,res,responseTime,context',
                  },
                },
              ]
            : []),
          ...(env.get('LOGGER_FILE_TARGET_ENABLE')
            ? [
                {
                  target: 'pino/file',
                  level: env.get('LOGGER_FILE_LEVEL'),
                  options: { destination: logFilePath },
                },
              ]
            : []),
        ],
      },
      serializers: {
        req(req: { method: string; url: string; id?: string }): {
          method: string;
          url: string;
          id?: string;
        } {
          return {
            method: req.method,
            url: req.url,
            id: req.id,
          };
        },
      },
    },
  };
};

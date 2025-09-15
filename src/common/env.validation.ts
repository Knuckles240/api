import { plainToInstance } from 'class-transformer';
import { IsNumber, IsString, validateSync } from 'class-validator';

class EnvironmentVariables {
    @IsNumber()
    PORT: number;
    
    @IsString()
    DATABASE_URL: string;
    
    @IsString()
    ACCESS_TOKEN_SECRET: string;
    
    @IsString()
    ACCESS_TOKEN: string;
    
    @IsString()
    REFRESH_TOKEN_SECRET: string;

    @IsString()
    REFRESH_TOKEN: string;
}

export function validate(config: Record<string, unknown>) {
    const validatedConfig = plainToInstance(
        EnvironmentVariables,
        config,
        { enableImplicitConversion: true },
    );
    const errors = validateSync(validatedConfig, { skipMissingProperties: false });

    if (errors.length > 0) {
        throw new Error(errors.toString());
    }
    return validatedConfig;
}

import {Context} from 'aws-lambda';

// A type definition to aid readability
export type AsyncHandler = (event: any, context: Context) => Promise<any>;

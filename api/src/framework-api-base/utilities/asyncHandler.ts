import {Context, ProxyResult} from 'aws-lambda';

// A convenience overload
export type AsyncHandler = (event: any, context: Context) => Promise<ProxyResult | void>;

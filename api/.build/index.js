"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Companies_1 = require("./src/Companies");
/*
 * The handler logic
 */
class RequestHandler {
    static HandleRequest(event, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const companies = new Companies_1.Companies();
            const response = {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'API called successfully: ' + companies.GetCompanies(),
                }),
            };
            return response;
        });
    }
}
// Export the handler which is referenced in the serverless.yml file
const handler = RequestHandler.HandleRequest;
exports.handler = handler;

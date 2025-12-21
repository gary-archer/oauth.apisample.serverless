/*
 * Text validation utilities
 */
export class TextValidator {

    /*
     * Sanitize input text such as correlation IDs and reject suspicious input
     */
    public static sanitize(input: string): string {

        if (/^[a-z0-9-]+$/i.test(input) && input.length < 64) {
            return input;
        }

        return '';
    }
}

module.exports.schema = {
    "title": "JSON schema for JSONPatch files",
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "array",
    "items": {
        "$ref": "#/definitions/operation"
    },
    "definitions": {
        "operation": {
            "type": "object",
            "required": ["op", "path"],
            "allOf": [{ "$ref": "#/definitions/path" }],
            "oneOf": [
                {
                    "required": ["value"],
                    "properties": {
                        "op": {
                            "description": "The operation to perform.",
                            "type": "string",
                            "enum": ["replace"]
                        },
                        "value": {
                            "description": "The value to replace."
                        }
                    }
                },
                {
                    "properties": {
                        "op": {
                            "description": "The operation to perform.",
                            "type": "string",
                            "enum": ["remove"]
                        }
                    }
                }
            ]
        },
        "path": {
            "properties": {
                "path": {
                    "description": "A JSON Pointer path.",
                    "type": "string"
                }
            }
        }
    }
};
module.exports.schema = {
    "backoffice-response": {},
    "service-response": {},
    "client-request": {
        "required": ["Surname", "Forename", "CommunicationDetails", "AddressDetails"],
        "type": "object",
        "properties": {
            "Surname": {
                "description": "Member's surname",
                "type": "string",
                "maxLength": 30
            },
            "Forename": {
                "description": "Member's forename",
                "type": "string",
                "maxLength": 15
            },
            "Title": {
                "description": "Member's title",
                "type": "string",
                "maxLength": 10
            },
            "PhoneNumber": {
                "description": "Member's phone number",
                "type": "string",
                "maxLength": 25
            },
            "CommunicationDetails": {
                "required": ["PreferredISOLanguageCode"],
                "type": "object",
                "properties": {
                    "PreferredISOLanguageCode": {
                        "description": "Preferred communications language code",
                        "type": "string"
                    },
                    "Email": {
                        "description": "Contact email address",
                        "type": "string",
                        "maxLength": 50
                    }
                }
            },
            "AddressDetails": {
                "required": ["ISOCountryCode"],
                "type": "object",
                "properties": {
                    "AddressLine1": {
                        "description": "First line of address",
                        "type": "string",
                        "maxLength": 30
                    },
                    "AddressLine2": {
                        "description": "Second line of address",
                        "type": "string",
                        "maxLength": 30
                    },
                    "AddressLine3": {
                        "description": "Third line of address",
                        "type": "string",
                        "maxLength": 30
                    },
                    "City": {
                        "description": "City",
                        "type": "string",
                        "maxLength": 30
                    },
                    "USStateCode": {
                        "description": "US State Code",
                        "type": "string",
                        "maxLength": 2
                    },
                    "Province": {
                        "description": "Province",
                        "type": "string",
                        "maxLength": 30
                    },
                    "Postcode": {
                        "description": "Postcode",
                        "type": "string",
                        "maxLength": 10
                    },
                    "ISOCountryCode": {
                        "description": "A 3 digit ISO Country Code (* may be changed to a 2 digit ISO 3166-1 code)",
                        "type": "string",
                        "minLength": 3,
                        "maxLength": 3
                    }
                }
            }
        }
    }
}

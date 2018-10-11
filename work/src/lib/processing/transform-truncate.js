// truncates a request based on the schema spec
module.exports.process = truncate;

function truncate (object, schema) {
    if(!isValidSchema(schema)) {
        return object;
    }
    for(let propertyName in schema.properties) {
        let propertyDefinition = schema.properties[propertyName];
        if(!object.hasOwnProperty(propertyName)) {
            // console.debug(`Skipping ${propertyName} as it is not defined`);
            continue;
        }
        let property = object[propertyName];
        if(propertyDefinition.type === 'object') {
            if(typeof property !== 'object') {
                // console.debug(`Skipping ${propertyName} as it is not an object`);
                continue;
            }
            // console.debug(`Recursive call for ${propertyName}`);
            object[propertyName] = truncate(property, propertyDefinition);
        }
        if(propertyDefinition.type === 'string' && propertyDefinition.maxLength) {
            object[propertyName] = truncateString(property, propertyDefinition.maxLength);
        }
    }
    return object;
}

function isValidSchema(schema) {
    if(typeof schema !== 'object') {
        return false;
    }
    if(!schema.hasOwnProperty('properties')) {
        return false;
    }
    return true;
}

function truncateString(value, maxLength) {
    if(typeof value === 'string' && value.length > maxLength) {
        return value.substring(0, maxLength);
    }
    return value;
}
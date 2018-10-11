// remove any null properties
module.exports.process = condense;

function condense (object) {
    for(let propertyName in object) {
        let property = object[propertyName];
        if(property === null) {
            delete object[propertyName];
        } else if (typeof property === 'object') {
            object[propertyName] = condense(property);
        }
    }
    return object;
}

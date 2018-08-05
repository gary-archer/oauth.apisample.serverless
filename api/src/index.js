exports.handler = async (event) => {
    return {
        output: `Input received is ${event.input}`
    };
};

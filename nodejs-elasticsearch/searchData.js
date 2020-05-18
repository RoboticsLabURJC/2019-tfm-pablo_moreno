const esClient = require('./client');
const searchDoc = async function(indexName, mappingType, payload){
    return await esClient.search({
        index: indexName,
        type: mappingType,
        body: payload
    });
}

module.exports = searchDoc;


async function test(){
    const body = {
        query: {
            match: {
                "title": "Learn"
            }
        }
    }
    try {
        const resp = await searchDoc('competition', 'comp1', body);
        console.log(resp);
    } catch (e) {
        console.log(e);
    }
}
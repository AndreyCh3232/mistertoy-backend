export default {
    // dbURL: 'mongodb+srv://theUser:thePass@cluster0-klgzh.mongodb.net/test?retryWrites=true&w=majority',
    dbURL: process.env.MONGODB_URL,
    dbName: 'toy_db',
}

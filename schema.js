const fetch = require("node-fetch");
const util = require("util");
const parseXML = util.promisify(require("xml2js").parseString);
const {
  GraphQLSchema,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
  GraphQLList
} = require("graphql");

//here is where you're detailing the schema of the returned object
const BookType = new GraphQLObjectType({
    name: 'Book',
    description: '...',

    fields: () => ({
        title: {
            type: GraphQLString, 
            resolve: xml => 
            xml.GoodreadsResponse.book[0].title[0]
        },
        isbn: {
            type: GraphQLString,
            resolve: xml => 
            xml.GoodreadsResponse.book[0].isbn[0]
        }
    })
})

const AuthorType = new GraphQLObjectType({
  name: "Author",
  description: "...",
  fields: () => ({
    name: {
      type: GraphQLString, 
      resolve: xml =>
        xml.GoodreadsResponse.author[0].name[0]
    },
    books: {
        type: new GraphQLList(BookType),  
        resolve: xml => {
        const ids = xml.GoodreadsResponse.author[0].books[0].book.map(elem => elem.id[0]._) //awkward underscore is from how xml2json works
        return Promise.all(ids.map(id => 
          //this is a 'nested fetch' (as opposed to outer fetch)
          fetch(`https://www.goodreads.com/author/show.xml?id=${id}&key=ZZYjhoulWBGDw6Yhymeepg`)
          .then(response => response.text())
          .then(parseXML)
          ))
        }
    }
  })
});
module.exports = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "Query",
    description: "...",
    fields: () => ({
      author: {
        type: AuthorType,
        args: {
          id: { type: GraphQLInt }
        },
        resolve: (root, args) =>
          fetch(`https://www.goodreads.com/author/show.xml?id=${args.id}&key=ZZYjhoulWBGDw6Yhymeepg`
          )
            .then(response => response.text())
            .then(parseXML)
      }
    })
  })
});

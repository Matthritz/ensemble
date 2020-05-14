const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  GraphQLObjectType, GraphQLString, GraphQLID, GraphQLList,
} = require('graphql');
const { db } = require('../pgAdapter');
const {
  MemberType,
  FriendType,
  MessageType,
  CommentType,
  SongUserType,
  SongType,
} = require('./types');

exports.query = new GraphQLObjectType({
  name: 'RootQueryType',
  type: 'Query',
  fields: {
    getAllSongs: {
      type: new GraphQLList(SongType),
      resolve() {
        const query = 'SELECT * FROM song';
        return db.any(query)
          .then((data) => data)
          .catch((err) => { console.log('err', err); });
      },
    },
    logIn: {
      type: MemberType,
      args: { username: { type: GraphQLString }, password: { type: GraphQLString } },
      resolve(parentValue, args) {
        const query = 'SELECT * FROM member WHERE username=$1';
        return db
          .one(query, [args.username])
          .then((member) => bcrypt.compare(args.password, member.password)
            .then((result) => {
              if (result) {
                return {
                  auth: true,
                  token: jwt.sign({
                    id: member.id,
                    username: member.username,
                    email: member.email,
                    url_avatar: member.url_avatar,
                  }, process.env.secret, { expiresIn: 86400 }),
                };
              }
              return { auth: false, token: null };
            }))
          .catch((err) => console.log(err.message));
      },
    },
  },
});

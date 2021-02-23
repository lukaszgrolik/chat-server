import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

const privateKey = 'terefere';

let userCount = 0;
let postCount = 0;
const db = {
    users: [
        {id: ++userCount, email: 'a@b.c', passwordHash: 'aaa_encrypted'},
        {id: ++userCount, email: 'lorem@ipsum.com', passwordHash: 'bbb_encrypted'},
    ],
    posts: [
        {id: ++postCount, userId: 1, title: 'my post 1'},
        {id: ++postCount, userId: 1, title: 'my post 2'},
        {id: ++postCount, userId: 2, title: 'post draft'},
    ],
};

// jwt.sign({ foo: 'bar' }, privateKey, { algorithm: 'RS256' }, function (err, token) {
//     if (err) throw err;

//     console.log('token', token);
// });

class Auth {
    // @todo use bcrypt
    encryptPassword(pw: string) {
        return `${pw}_encrypted`;
    }

    verifyPassword(pw: string, pwHash: string) {
        return this.encryptPassword(pw) === pwHash;
    }

    genToken(userId: number) {
        const token = jwt.sign({ data: { userId } }, privateKey, { algorithm: 'HS256', expiresIn: 60 });
        return token;
    }

    verifyToken(token: string) {
        const ok = jwt.verify(token, privateKey);
        // console.log('ok', ok, new Date((ok as any).iat * 1000), (ok as any).data.email)

        return (ok as {data: {userId: number}});
    }

    refreshToken() {

    }
}

class Server {
    readonly auth = new Auth();

    async registerUser(body: {email: string, password: string}) {
        // @todo validate email
        // @todo validate password
        const user = {
            id: ++userCount,
            email: body.email,
            passwordHash: this.auth.encryptPassword(body.password),
        };

        db.users.push(user);

        return {
            user,
            token: this.auth.genToken(user.id),
        };
    }

    async login(body: {email: string; password: string}) {
        // @todo validate email
        // @todo validate password
        const user = db.users.find(u => u.email === body.email);
        if (!user) throw new Error('invalid credentials');

        const pwHash = this.auth.encryptPassword(body.password)
        if (!this.auth.verifyPassword(body.password, pwHash)) throw new Error('invalid credentials');

        return {
            user,
            token: this.auth.genToken(user.id),
        };
    }

    async fetchPosts(opts: {token: string}) {
        const ok = this.auth.verifyToken(opts.token);
        if (!ok) throw new Error('invalid token');

        const user = db.users.find(u => u.id === ok.data.userId);
        if (!user) throw new Error('invalid credentials');

        return db.posts.filter(p => p.userId === user.id);
    }
}

// (() => {
//     const token = jwt.sign({ data: { email: 'a@b.c'} }, privateKey, { algorithm: 'HS256', expiresIn: 60 });
//     console.log('token', token)

//     const ok = jwt.verify(token, privateKey);
//     console.log('ok', ok, new Date((ok as any).iat * 1000), (ok as any).data.email)
// })();


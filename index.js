// TODO: Instalar a biblioteca npm install cors --save
// TODO: Instalar a biblioteca npm install --save jsonwebtoken

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const JWSTSecret = "astofiniusnoretilinius";

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Criando um middleware. O middleware é uma função que é executada antes da sua requisição ser efetuada
// TODO: O middleware protege a rota com autenticação

function auth(req, res, next) {
    const authToken = req.headers['authorization'];

    if(authToken != undefined) {

        const bearer = authToken.split(' ')
        var token = bearer[1]

        jwt.verify(token, JWSTSecret, (err, data) => {
            if(err) {
                res.status(401)
                res.json({err: "Token inválido"})
            } else {
                req.token = token
                req.loggedUser = {id: data.id, email: data.email}
                req.empresa = "Guia do programador"
                next(); //! O next() é resposável por passar uma requisição p/ a rota que o usuário quer acessar.
            }
        })

    } else {
        res.status(401)
        res.json({err: "Token inválido"})
    }
}


var DB = {
    games: [

        {
            id: 23,
            title: "Call of duty MW",
            year: 2019,
            price: 60
        },

        {
            id: 65,
            title: "Sea of thieves",
            year: 2018,
            price: 40
        },

        {
            id: 2,
            title: "Minecraft",
            year: 2012,
            price: 20
        }

    ],

    users: [

        {
            id: 1,
            nome: "Vitor Paiola",
            email: "vitor@teste.com",
            password: "nodejs<3"
        },

        {
            id: 20,
            nome: "Guilherme",
            email: "gui@teste.com",
            password: "java123"
        }

    ]

}

app.get("/games", auth, (req, res) => {

    var HATEOAS = [
        {
            href: "http://localhost:45678/game/0",
            method: "DELETE",
            rel: "delete_game"
        },
        {
            href: "http://localhost:45678/game/0",
            method: "GET",
            rel: "get_game"
        },
        {
            href: "http://localhost:45678/auth",
            method: "POST",
            rel: "login"
        }

    ]

    res.statusCode = 200;
    res.json({games: DB.games, _links: HATEOAS});
});

app.get("/game/:id", auth, (req, res) => {
    if (isNaN(req.params.id)) {
        res.sendStatus(400)
    } else {

        var id = parseInt(req.params.id)

        var HATEOAS = [
            {
                href: "http://localhost:45678/game/"+id,
                method: "DELETE",
                rel: "delete_game"
            },
            {
                href: "http://localhost:45678/game/"+id,
                method: "PUT",
                rel: "edit_game"
            },
            {
                href: "http://localhost:45678/game/"+id,
                method: "GET",
                rel: "get_game"
            },
            {
                href: "http://localhost:45678/games",
                method: "GET",
                rel: "get_all_games"
            }
    
        ]

        var game = DB.games.find(g => g.id == id)

        if (game != undefined) {
            res.statusCode = 200
            res.json({game, _links: HATEOAS})
        } else {
            res.sendStatus(404)
        }

    }
});

app.post("/game", auth, (req, res) => {
    var { title, price, year } = req.body; 
    DB.games.push({
        id: DB.games.length + 1,
        title,
        price,
        year,
    });
    res.sendStatus(200)
})

app.delete("/game/:id", auth, (req, res) => {
    if(isNaN(req.params.id)) {
        res.sendStatus(400)
    } else {
        var id = parseInt(req.params.id);
        var index = DB.games.findIndex(g => g.id == id);

        if(index == -1) {
            res.sendStatus(404)
        } else {
            DB.games.splice(index, 1);
            res.sendStatus(200)
        }
    }
});

app.put("/game/:id", (req, res) => {

    if (isNaN(req.params.id)) {
        res.sendStatus(400)
    } else {

        var id = parseInt(req.params.id)

        var game = DB.games.find(g => g.id == id)

        if (game != undefined) {
            
            // TODO: Validação => if(title == undefined) {res.sendStatus(400)} else {res.sendStatus(200)} 
            var {title, price, year} = req.body;

            if(title != undefined) {
                game.title = title;
            }

            //! Aqui eu posso fazer uma validação para verificar se o price é um número, res.sendStatus(200)
            if(price != undefined) {
                game.price = price; 
            }

            //! Aqui eu posso fazer uma validação para verificar se o year é um número, res.sendStatus(400)
            if(year != undefined) { 
                game.year = year;
            }

            res.sendStatus(200)

        } else {
            res.sendStatus(404)
        }

    }

})

app.post("/auth", (req, res) => {

    var {email, password} = req.body

    if(email != undefined) {

         var user = DB.users.find(u => u.email == email)

         if(user != undefined) {

            if(user.password == password) {

                //! As informações passadas ao Token devem ter dados referentes ao dono deste Token.
                //! Como segundo parâmetro passamos a chave secreta que irá gerar este Token
                //! E depois informamos enquanto tempo queremos que este Token expire
                jwt.sign({id: user.id, email: user.email}, JWSTSecret, {expiresIn:'48h'}, (err, token) => {
                    if(err) {
                        res.status(400)
                        res.json({err: "Falha interna"})
                    } else {
                        res.status(200)
                        res.json({token: token})
                    }
                })
            } else {
                res.status(401)
                res.json({error: "Senha incorreta"})
            }

         } else {
            res.status(404)
            res.json({error: "O E-mail enviado não existe na base de dados"})
         }

    } else {
        res.status(400)
        res.json({error: "O E-mail enviado é inválido"})
    }

})

app.listen(45678, () => {
    console.log("API RODANDO!");
});

// TODO: Promise é um processo que está acontecendo e pode ser encadeado em funções de retorno de chamada.
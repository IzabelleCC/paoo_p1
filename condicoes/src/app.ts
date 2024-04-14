import express from 'express'
import { v4 as uuidv4 } from 'uuid'

import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const app = express()
app.use(express.json())

interface Condicao {
    idCond: string;
    name: string;
    lat: number;
    lon: number;
    dt: number;
    feels_like: number;
    description: string;
    coordenadaId: string;
}

const condicoes: Record<string, Condicao[]> = {}


app.post('/coordenadas/:id/condicoes', async (req, res) => {
    const idCond = uuidv4();

    const consulta = await axios.get('http://localhost:6000/coordenadas')
    const lat = consulta.data[req.params.id].coordenada.lat
    const lon= consulta.data[req.params.id].coordenada.lon
    const { APPID, UNITS, LANGUAGE, URL_BASE } = process.env
    const url = `${URL_BASE}?lat=${lat}&lon=${lon}&appid=${APPID}&units=${UNITS}&lang=${LANGUAGE}`

    try{
        const response = await axios.get(url)
        const feels_like = response.data.main.feels_like
        const description = response.data.weather[0].description
        const dt = response.data.dt
        const name = response.data.name
        const condicaoDaCidade : Condicao[] = condicoes[req.params.id]  || []

        condicaoDaCidade.push({ idCond, name, lat, lon, dt, feels_like, description, coordenadaId: req.params.id})

        condicoes[req.params.id] = condicaoDaCidade

        await axios.post('http://localhost:10000/eventos', {
            tipo: 'CondicoesDaCidadeCriada',
            dados: {id: idCond, name, lat, lon, dt, feels_like, description, coordenadaId: req.params.id}
        })

        res.status(201).json(condicaoDaCidade)        
    }
    catch (erro){
        res.status(400).json({ erro: 'Cidade nao encontrada.'})
    }

})
app.post("/eventos", (req, res) => {
    console.log(req.body);
    res.status(200).send({ msg: "ok" });
});

app.get('/coordenadas/:id/condicoes', (req, res) => {
    res.json(condicoes[req.params.id] || [])
 })

const port = 5000
app.listen(port,() => console.log(`Coordenadas. Porta ${port}.`))

export {Condicao}
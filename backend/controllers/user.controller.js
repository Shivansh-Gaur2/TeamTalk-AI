import userModel from '../models/user.model.js';
import * as userService from '../services/user.services.js';
import { validationResult } from 'express-validator';
import redisClient from '../services/redis.service.js';


export const createUserController = async(req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors : errors.array()});
    }

    try{
        const user = await userService.createUser(req.body);

        const token = await user.generateJWT();

        delete user._doc.password;

        res.status(201).send({user, token});
    }catch(err){
        return res.status(400).send(err.message);
    }
}

export const loginUserController = async(req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors : errors.array()});
    }

    try{
        const user = await userModel.findOne({email : req.body.email}).select('+password');
        if(!user){
            return res.status(401).json({errors : 'Invalid credentials'});
        }

        const isValid = await user.isValidPassword(req.body.password);
        if(!isValid){
            return res.status(401).json({errors : 'Invalid credentials'});
        }

        const token = await user.generateJWT();
        delete user._doc.password;
        res.status(200).send({user, token});

    }catch(err){
        return res.status(400).send(err.message);
    }
}

export const profileController = async(req, res) => {
    console.log(req.user);
    res.status(200).json({user : req.user});
}

export const logoutController = async(req, res) => {
    try{
        const token = req.cookies.token || req.headers.authorization.split(' ')[1];
        redisClient.set(token, 'logout', 'EX', 60*60*24);

        res.status(200).json({
            message: 'Loged out successfully'
        });
    }
    catch(err){
        return res.status(400).send(err.message);
    }
}
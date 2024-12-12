import fs from 'fs/promises'
import Cryptr from 'cryptr'

import { utilService } from './util.service.js'

const cryptr = new Cryptr(process.env.SECRET1 || 'secret-puk-1234')
let users = utilService.readJsonFile('data/user.json')

export const userService = {
    query,
    getById,
    remove,
    save,
    checkLogin,
    getLoginToken,
    validateToken,
}

async function query() {
    const usersToReturn = users.map(user => ({ _id: user._id, fullname: user.fullname }))
    return usersToReturn
}

async function getById(userId) {
    var user = users.find(user => user._id === userId)
    if (!user) throw new Error('User not found!')

    return {
        _id: user._id,
        username: user.username,
        fullname: user.fullname,
    }
}

async function remove(userId) {
    users = users.filter(user => user._id !== userId)
    await _saveUsersToFile()
}

async function save(user) {
    user = {
        _id: utilService.makeId(),
        fullname: user.fullname,
        password: user.password,
        username: user.username,
    }
    users.push(user)
    await _saveUsersToFile()
    return user

}

async function checkLogin({ username, password }) {
    const user = users.find(user => user.username === username && user.password === password)
    if (user) {
        user = {
            _id: user._id,
            fullname: user.fullname,
            isAdmin: user.isAdmin,
        }
    }
    return null
}

function getLoginToken(user) {
    const str = JSON.stringify(user)
    const encryptedStr = cryptr.encrypt(str)
    return encryptedStr
}

function validateToken(token) {
    if (!token) return null

    const str = cryptr.decrypt(token)
    const user = JSON.parse(str)
    return user
}

async function _saveUsersToFile() {
    const usersStr = JSON.stringify(users, null, 2)
    try {
        await fs.writeFile('data/user.json', usersStr)
    } catch (err) {
        console.error('Error saving users to file:', err)
        throw err
    }
}
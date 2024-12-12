import fs from 'fs/promises'
import { utilService } from './util.service.js'

let toys = await utilService.readJsonFile('data/toy.json')
const PAGE_SIZE = 5

export const toyService = {
    query,
    getById,
    save,
    remove,
}

async function query({ sortBy, sortDir = 1, pageIdx = 0, pageSize = PAGE_SIZE, txt, minSeverity, labels } = {}) {
    let filteredtoys = toys

    // Filtering
    if (txt) {
        filteredtoys = filteredtoys.filter(toy =>
            toy.title.toLowerCase().includes(txt.toLowerCase()) ||
            toy.description.toLowerCase().includes(txt.toLowerCase())
        )
    }
    if (minSeverity) {
        filteredtoys = filteredtoys.filter(toy => toy.severity >= +minSeverity)
    }
    if (labels) {
        const labelArr = labels.split(',')
        filteredtoys = filteredtoys.filter(toy =>
            toy.labels.some(label => labelArr.includes(label))
        )
    }

    // Sorting
    if (sortBy) {
        filteredtoys.sort((a, b) => {
            if (a[sortBy] < b[sortBy]) return sortDir === '1' ? -1 : 1;
            if (a[sortBy] > b[sortBy]) return sortDir === '1' ? 1 : -1;
            return 0
        })
    }

    // Paging
    const startIdx = pageIdx * pageSize
    filteredtoys = filteredtoys.slice(startIdx, startIdx + pageSize)

    return Promise.resolve(toys)
}

async function getById(toyId) {
    const toy = toys.find((toy) => toy._id === toyId)
    if (!toy) throw new Error(`Cannot find toy with ID ${toyId}`)
    return toy
}

async function remove(toyId) {
    const toyIdx = toys.findIndex((toy) => toy._id === toyId)
    if (toyIdx === -1) throw new Error(`Cannot find toy with ID ${toyId}`)
    toys.splice(toyIdx, 1)
    await _saveToysToFile()
}

async function save(toyToSave) {
    if (toyToSave._id) {
        const toyIdx = toys.findIndex((toy) => toy._id === toyToSave._id)
        if (toyIdx === -1) throw new Error(`Cannot find toy with ID ${toyToSave._id}`)
        toys[toyIdx] = toyToSave
    } else {
        toyToSave._id = utilService.makeId()
        toyToSave.createdAt = Date.now()
        toys.unshift(toyToSave)
    }
    await _saveToysToFile()
    return toyToSave
}

async function _saveToysToFile() {
    await fs.writeFile('data/toy.json', JSON.stringify(toys, null, 2))
}

// const STORAGE_KEY = 'toyDB'
// _createtoys()

// function _createtoys() {
//   let toys = utilService.loadFromStorage(STORAGE_KEY)
//   if (!toys || !toys.length) {
//     toys = [
//       {
//         title: 'Infinite Loop Detected',
//         severity: 4,
//         _id: '1NF1N1T3'
//       },
//       {
//         title: 'Keyboard Not Found',
//         severity: 3,
//         _id: 'K3YB0RD'
//       },
//       {
//         title: '404 Coffee Not Found',
//         severity: 2,
//         _id: 'C0FF33'
//       },
//       {
//         title: 'Unexpected Response',
//         severity: 1,
//         _id: 'G0053'
//       }
//     ]
//     utilService.saveToStorage(STORAGE_KEY, toys)
//   }
// }



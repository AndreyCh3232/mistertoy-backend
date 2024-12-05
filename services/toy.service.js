import fs from 'fs'
import { utilService } from './util.service.js'

const toys = utilService.readJsonFile('data/toy.json')
const PAGE_SIZE = 5

export const toyService = {
    query,
    getById,
    save,
    remove,
}

function query({ sortBy, sortDir = 1, pageIdx = 0, pageSize = PAGE_SIZE, txt, minSeverity, labels } = {}) {
    var filteredtoys = toys

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
function getById(toyId) {
    const toy = toys.find((toy) => toy._id === toyId)
    if (!toy) return Promise.reject('cannot find toy' + toyId)
    return Promise.resolve(toy)
}

function remove(toyId) {
    const toyIdx = toys.findIndex((toy) => toy._id === toyId)
    toys.splice(toyIdx, 1)
    return _savetoysToFile()
}

function save(toyToSave) {
    if (toyToSave._id) {
        const toyIdx = toys.findIndex((toy) => toy._id === toyToSave._id)
        if (toyIdx === -1) return Promise.reject(`Cannot find toy with ID ${toyToSave._id}`)
        toys[toyIdx] = toyToSave
    } else {
        toyToSave._id = utilService.makeId()
        toyToSave.createdAt = Date.now()
        toys.unshift(toyToSave)
    }
    return _savetoysToFile().then(() => toyToSave)
}

function _savetoysToFile() {
    return fs.writeFile('data/toy.json', JSON.stringify(toys, null, 2))
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



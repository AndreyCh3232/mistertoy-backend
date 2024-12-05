import fs from 'fs'
import { utilService } from './util.service.js'

const bugs = utilService.readJsonFile('data/bug.json')
const PAGE_SIZE = 5

export const bugService = {
    query,
    getById,
    save,
    remove,
}

function query({ sortBy, sortDir = 1, pageIdx = 0, pageSize = PAGE_SIZE, txt, minSeverity, labels } = {}) {
    var filteredBugs = bugs

    // Filtering
    if (txt) {
        filteredBugs = filteredBugs.filter(bug =>
            bug.title.toLowerCase().includes(txt.toLowerCase()) ||
            bug.description.toLowerCase().includes(txt.toLowerCase())
        )
    }
    if (minSeverity) {
        filteredBugs = filteredBugs.filter(bug => bug.severity >= +minSeverity)
    }
    if (labels) {
        const labelArr = labels.split(',')
        filteredBugs = filteredBugs.filter(bug =>
            bug.labels.some(label => labelArr.includes(label))
        )
    }

    // Sorting
    if (sortBy) {
        filteredBugs.sort((a, b) => {
            if (a[sortBy] < b[sortBy]) return sortDir === '1' ? -1 : 1;
            if (a[sortBy] > b[sortBy]) return sortDir === '1' ? 1 : -1;
            return 0
        })
    }

    // Paging
    const startIdx = pageIdx * pageSize
    filteredBugs = filteredBugs.slice(startIdx, startIdx + pageSize)

    return Promise.resolve(bugs)
}
function getById(bugId) {
    const bug = bugs.find((bug) => bug._id === bugId)
    if (!bug) return Promise.reject('cannot find bug' + bugId)
    return Promise.resolve(bug)
}

function remove(bugId) {
    const bugIdx = bugs.findIndex((bug) => bug._id === bugId)
    bugs.splice(bugIdx, 1)
    return _saveBugsToFile()
}

function save(bugToSave) {
    if (bugToSave._id) {
        const bugIdx = bugs.findIndex((bug) => bug._id === bugToSave._id)
        if (bugIdx === -1) return Promise.reject(`Cannot find bug with ID ${bugToSave._id}`)
        bugs[bugIdx] = bugToSave
    } else {
        bugToSave._id = utilService.makeId()
        bugToSave.createdAt = Date.now()
        bugs.unshift(bugToSave)
    }
    return _saveBugsToFile().then(() => bugToSave)
}

function _saveBugsToFile() {
    return fs.writeFile('data/bug.json', JSON.stringify(bugs, null, 2))
}

// const STORAGE_KEY = 'bugDB'
// _createBugs()

// function _createBugs() {
//   let bugs = utilService.loadFromStorage(STORAGE_KEY)
//   if (!bugs || !bugs.length) {
//     bugs = [
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
//     utilService.saveToStorage(STORAGE_KEY, bugs)
//   }
// }



function createEventEmitter() {
    const listenersMap = {}
    return {
        on(evName, listener) {
            listenersMap[evName] = (listenersMap[evName]) ? [...listenersMap[evName], listener] : [listener]
            return () => {
                listenersMap[evName] = listenersMap[evName].filter(func => func !== listener)
            }
        },
        async emit(evName, data) {
            if (!listenersMap[evName]) return
            for (const listener of listenersMap[evName]) {
                await listener(data)
            }
        }
    }
}

export const eventBusService = createEventEmitter()

export async function showUserMsg(msg) {
    await eventBusService.emit('show-user-msg', msg)
}

export async function showSuccessMsg(txt) {
    await showUserMsg({ txt, type: 'success' })
}
export async function showErrorMsg(txt) {
    await showUserMsg({ txt, type: 'error' })
}
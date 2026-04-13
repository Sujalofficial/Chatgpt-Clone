const { v4: uuidv4 } = require('uuid');

class SandboxMemoryStore {
    constructor() {
        // Map<userId, Map<chatId, chatDoc>>
        this.store = new Map();
    }

    getUserStore(userId) {
        if (!this.store.has(userId)) {
            this.store.set(userId, new Map());
        }
        return this.store.get(userId);
    }
}

// Global instance to persist across requests during the server lifecycle
const memoryStore = new SandboxMemoryStore();

class SandboxChat {
    constructor(data) {
        this.data = { ...data, _id: uuidv4(), updatedAt: new Date(), columns: {} };
    }

    async save() {
        const userChats = memoryStore.getUserStore(this.data.user);
        userChats.set(this.data._id, this.data);
        Object.assign(this, this.data);
        return this;
    }

    static find(query) {
        const userChats = memoryStore.getUserStore(query.user);
        const chats = Array.from(userChats.values());
        
        // Mock Mongoose chainable query
        return {
            sort: () => ({
                skip: (s) => ({
                    limit: (l) => ({
                        lean: async () => {
                            const sorted = chats.sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                            return sorted.slice(s, s + l);
                        }
                    })
                })
            })
        };
    }

    static async countDocuments(query) {
        return memoryStore.getUserStore(query.user).size;
    }

    static async findOne(query) {
        const userChats = memoryStore.getUserStore(query.user);
        const chat = userChats.get(query._id);
        if (chat) {
            // Mock mongoose document with save() method
            return {
                ...chat,
                save: async function() { 
                    this.updatedAt = new Date();
                    userChats.set(this._id, Object.assign({}, this)); 
                    return this; 
                }
            };
        }
        return null;
    }

    static async findOneAndUpdate(query, update, options) {
        let chat = null;
        let pUser = null;
        
        if (query.user) {
            chat = memoryStore.getUserStore(query.user).get(query._id);
            pUser = query.user;
        } else {
            // In cases where we just search by _id
            for (const [uid, uStore] of memoryStore.store.entries()) {
                if (uStore.has(query._id)) {
                    chat = uStore.get(query._id);
                    pUser = uid;
                    break;
                }
            }
        }

        if (!chat) return null;

        if (update.$set) {
            for (const k in update.$set) {
                if (k.startsWith('columns.')) {
                    const col = k.split('.')[1];
                    if (!chat.columns) chat.columns = {};
                    chat.columns[col] = update.$set[k];
                } else {
                    chat[k] = update.$set[k];
                }
            }
        }
        if (update.title) chat.title = update.title;
        chat.updatedAt = new Date();
        
        memoryStore.getUserStore(pUser).set(chat._id, chat);
        
        // Return deep copy so modifications don't instantly reflect without save
        return JSON.parse(JSON.stringify(chat));
    }

    static async findOneAndDelete(query) {
        const userChats = memoryStore.getUserStore(query.user);
        userChats.delete(query._id);
        return true;
    }
}

module.exports = SandboxChat;

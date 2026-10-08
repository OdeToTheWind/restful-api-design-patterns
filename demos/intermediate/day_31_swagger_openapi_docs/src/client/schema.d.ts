// Generated from openapi.json by `pnpm openapi:generate`. Do not edit by hand.

export interface paths {
    "/api/books": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List books, newest first */
        get: operations["listBooks"];
        put?: never;
        /** Add a book */
        post: operations["createBook"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/books/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get one book */
        get: operations["getBook"];
        put?: never;
        post?: never;
        /** Remove a book */
        delete: operations["deleteBook"];
        options?: never;
        head?: never;
        /** Update some fields of a book */
        patch: operations["updateBook"];
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        ErrorResponse: {
            /** @enum {boolean} */
            success: false;
            message: string;
            /** @description Field errors (400) or failing dependencies (503); otherwise null */
            errors: {
                [key: string]: string[] | string;
            } | null;
            /** Format: date-time */
            timestamp: string;
        };
        Book: {
            id: string;
            title: string;
            author: string;
            isbn: string;
            publishedYear: number | null;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    listBooks: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Books */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @enum {boolean} */
                        success: true;
                        message: string;
                        data: components["schemas"]["Book"][];
                        /** Format: date-time */
                        timestamp: string;
                    };
                };
            };
        };
    };
    createBook: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": {
                    /** @example The Pragmatic Programmer */
                    title: string;
                    /** @example David Thomas, Andrew Hunt */
                    author: string;
                    /** @example 978-0-13-468599-1 */
                    isbn: string;
                    /** @example 2019 */
                    publishedYear?: number;
                };
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @enum {boolean} */
                        success: true;
                        message: string;
                        data: components["schemas"]["Book"];
                        /** Format: date-time */
                        timestamp: string;
                    };
                };
            };
            /** @description Validation failed */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description A book with this ISBN already exists */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    getBook: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The book */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @enum {boolean} */
                        success: true;
                        message: string;
                        data: components["schemas"]["Book"];
                        /** Format: date-time */
                        timestamp: string;
                    };
                };
            };
            /** @description Invalid id */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    deleteBook: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Deleted */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @enum {boolean} */
                        success: true;
                        message: string;
                        data: null;
                        /** Format: date-time */
                        timestamp: string;
                    };
                };
            };
            /** @description Invalid id */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    updateBook: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": {
                    /** @example The Pragmatic Programmer */
                    title?: string;
                    /** @example David Thomas, Andrew Hunt */
                    author?: string;
                    /** @example 978-0-13-468599-1 */
                    isbn?: string;
                    /** @example 2019 */
                    publishedYear?: number;
                };
            };
        };
        responses: {
            /** @description Updated */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @enum {boolean} */
                        success: true;
                        message: string;
                        data: components["schemas"]["Book"];
                        /** Format: date-time */
                        timestamp: string;
                    };
                };
            };
            /** @description Validation failed */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description A book with this ISBN already exists */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
}

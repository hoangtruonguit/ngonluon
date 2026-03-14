export class MovieCreatedEvent {
    constructor(public readonly movieId: string) {}
}

export class MovieUpdatedEvent {
    constructor(public readonly movieId: string) {}
}

export class MovieDeletedEvent {
    constructor(public readonly movieId: string) {}
}

export class MoviesBulkCreatedEvent {
    constructor(public readonly movieIds: string[]) {}
}
export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  createdAt: Date;
}

export class TodoModel {
  private todos: Todo[] = [];

  getAll(): Todo[] {
    return this.todos;
  }

  getById(id: number): Todo | undefined {
    return this.todos.find(t => t.id === id);
  }

  create(title: string): Todo {
    const todo: Todo = {
      id: Date.now(),
      title,
      completed: false,
      createdAt: new Date()
    };
    this.todos.push(todo);
    return todo;
  }

  update(id: number, updates: Partial<Todo>): Todo | null {
    const todo = this.getById(id);
    if (!todo) return null;
    Object.assign(todo, updates);
    return todo;
  }

  delete(id: number): boolean {
    const index = this.todos.findIndex(t => t.id === id);
    if (index === -1) return false;
    this.todos.splice(index, 1);
    return true;
  }
}
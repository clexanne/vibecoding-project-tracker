import {useEffect, useRef, useState} from 'react';
import TypeBadge, {TASK_TYPES, typeStyle} from './TypeBadge.jsx';

const inputClass =
    'mt-1 w-full rounded-md border border-slate-300 bg-surface-card px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary';
const labelClass = 'block text-sm font-medium text-text-primary';

/**
 * Add / edit modal for one task (M5).
 * `task` is null when creating; otherwise the task being edited.
 * Escape and the × button close it; focus returns to whatever opened it.
 */
export default function TaskModal({task, stages, members, onSave, onDelete, onClose}) {
    const isEditing = task != null;
    const [form, setForm] = useState(() => ({
        title: task?.title ?? '',
        description: task?.description ?? '',
        type: task?.type ?? 'feature',
        status: task?.status ?? 'todo',
        assignee: task?.assignee ?? members[0] ?? '',
        dueDate: task?.dueDate ?? '',
    }));
    const titleRef = useRef(null);

    // Move focus into the dialog on open and back to the opener on close.
    useEffect(() => {
        const opener = document.activeElement;
        titleRef.current?.focus();
        return () => opener?.focus?.();
    }, []);

    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    const update = (field) => (event) => setForm({...form, [field]: event.target.value});

    const handleSubmit = (event) => {
        event.preventDefault();
        onSave({...form, title: form.title.trim(), dueDate: form.dueDate || null});
    };

    const handleDelete = () => {
        if (window.confirm(`Delete "${task.title}"? This can't be undone.`)) onDelete(task.id);
    };

    return (
        <div
            className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/50 p-4"
            onMouseDown={(event) => event.target === event.currentTarget && onClose()}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="task-modal-title"
                className={`w-full max-w-lg rounded-lg border-l-4 ${typeStyle(form.type).stripe} bg-surface-card p-6 shadow-xl`}
            >
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 id="task-modal-title" className="text-lg font-semibold text-text-primary">
                            {isEditing ? 'Edit task' : 'New task'}
                        </h2>
                        <TypeBadge type={form.type}/>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="rounded-md px-2 text-xl leading-none text-text-muted hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="task-title" className={labelClass}>Title</label>
                        <input
                            id="task-title"
                            ref={titleRef}
                            required
                            value={form.title}
                            onChange={update('title')}
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label htmlFor="task-description" className={labelClass}>Description</label>
                        <textarea
                            id="task-description"
                            rows={3}
                            value={form.description}
                            onChange={update('description')}
                            className={inputClass}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <fieldset>
                            <legend className={labelClass}>Type</legend>
                            <div className="mt-1 flex gap-2">
                                {Object.entries(TASK_TYPES).map(([id, {label, Icon, text}]) => (
                                    <label
                                        key={id}
                                        className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium focus-within:ring-2 focus-within:ring-brand-primary ${
                                            form.type === id ? `border-current bg-brand-accent ${text}` : 'border-slate-300 text-text-muted'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="task-type"
                                            value={id}
                                            checked={form.type === id}
                                            onChange={update('type')}
                                            className="sr-only"
                                        />
                                        <Icon className="h-4 w-4" aria-hidden="true"/>
                                        {label}
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        <div>
                            <label htmlFor="task-status" className={labelClass}>Status</label>
                            <select id="task-status" value={form.status} onChange={update('status')}
                                    className={inputClass}>
                                {stages.map((stage) => (
                                    <option key={stage.id} value={stage.id}>{stage.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="task-assignee" className={labelClass}>Assignee</label>
                            <select id="task-assignee" value={form.assignee} onChange={update('assignee')}
                                    className={inputClass}>
                                {members.map((name) => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="task-due" className={labelClass}>Due date</label>
                            <input
                                id="task-due"
                                type="date"
                                value={form.dueDate}
                                onChange={update('dueDate')}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        {isEditing ? (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="min-h-10 rounded-md px-4 text-sm font-medium text-due-overdue hover:bg-due-overdue-bg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            >
                                Delete
                            </button>
                        ) : (
                            <span/>
                        )}
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="min-h-10 rounded-md border border-slate-300 px-4 text-sm font-medium text-text-primary hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="min-h-10 rounded-md bg-brand-primary px-4 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
                            >
                                {isEditing ? 'Save changes' : 'Add task'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

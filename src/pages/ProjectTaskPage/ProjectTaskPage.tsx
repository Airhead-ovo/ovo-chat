import { useEffect, useState } from "react";
import { Alert, Button, Card, Empty, Form, Input, List, Modal, Popconfirm, Select, Space, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { createProject, createTask, deleteProject, deleteTask, getProjects, getTasks, updateProject, updateTask, type Project, type Task, type TaskStatus } from "../../api/projects";
import styles from "./ProjectTaskPage.module.css";

const statusOptions = [
  { label: "待办", value: "todo" },
  { label: "进行中", value: "doing" },
  { label: "已完成", value: "done" },
] satisfies { label: string; value: TaskStatus }[];

type ProjectFields = { name: string; description?: string };
type TaskFields = { title: string; description?: string; status?: TaskStatus };

export default function ProjectTaskPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [projectError, setProjectError] = useState("");
  const [taskError, setTaskError] = useState("");
  const [projectModal, setProjectModal] = useState<Project | "new" | null>(null);
  const [taskModal, setTaskModal] = useState<Task | "new" | null>(null);
  const [projectForm] = Form.useForm<ProjectFields>();
  const [taskForm] = Form.useForm<TaskFields>();
  const [toast, toastContext] = message.useMessage();

  const selectedProject = projects.find(item => item.id === selectedId);

  const loadProjects = async (preferredId?: number | null) => {
    setProjectsLoading(true);
    setProjectError("");
    try {
      const items = await getProjects();
      setProjects(items);
      setSelectedId(previous => {
        const candidate = preferredId === undefined ? previous : preferredId;
        return items.some(item => item.id === candidate) ? candidate : items[0]?.id ?? null;
      });
    } catch (error) {
      setProjectError(error instanceof Error ? error.message : "读取项目失败");
    } finally {
      setProjectsLoading(false);
    }
  };

  useEffect(() => { void loadProjects(); }, []);

  const loadTasks = async (projectId: number, currentPage: number) => {
    setTasksLoading(true);
    setTaskError("");
    try {
      const result = await getTasks(projectId, currentPage);
      setTasks(result.items);
      setTotal(result.total);
    } catch (error) {
      setTasks([]);
      setTotal(0);
      setTaskError(error instanceof Error ? error.message : "读取任务失败");
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    if (selectedId === null) { setTasks([]); setTotal(0); return; }
    void loadTasks(selectedId, page);
  }, [selectedId, page]);

  const openProject = (project: Project | "new") => {
    setProjectModal(project);
    projectForm.setFieldsValue(project === "new" ? { name: "", description: "" } : {
      name: project.name, description: project.description ?? "",
    });
  };

  const saveProject = async () => {
    try {
      const values = await projectForm.validateFields();
      setSaving(true);
      const item = projectModal === "new" ? await createProject(values)
        : await updateProject((projectModal as Project).id, values);
      setProjectModal(null);
      toast.success("项目已保存");
      await loadProjects(item.id);
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    } finally { setSaving(false); }
  };

  const removeProject = async (id: number) => {
    try {
      await deleteProject(id);
      toast.success("项目已删除");
      if (selectedId === id) { setSelectedId(null); setPage(1); }
      await loadProjects(selectedId === id ? null : selectedId);
    } catch (error) { toast.error(error instanceof Error ? error.message : "删除项目失败"); }
  };

  const openTask = (task: Task | "new") => {
    setTaskModal(task);
    taskForm.setFieldsValue(task === "new" ? { title: "", description: "", status: "todo" } : {
      title: task.title, description: task.description ?? "", status: task.status,
    });
  };

  const saveTask = async () => {
    if (selectedId === null) return;
    try {
      const values = await taskForm.validateFields();
      setSaving(true);
      if (taskModal === "new") await createTask(selectedId, { title: values.title, description: values.description });
      else await updateTask(selectedId, (taskModal as Task).id, values);
      setTaskModal(null);
      toast.success("任务已保存");
      if (page !== 1) setPage(1);
      else await loadTasks(selectedId, page);
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    } finally { setSaving(false); }
  };

  const removeTask = async (taskId: number) => {
    if (selectedId === null) return;
    try {
      await deleteTask(selectedId, taskId);
      toast.success("任务已删除");
      if (page > 1 && tasks.length === 1) setPage(page - 1);
      else await loadTasks(selectedId, page);
    } catch (error) { toast.error(error instanceof Error ? error.message : "删除任务失败"); }
  };

  const columns: ColumnsType<Task> = [
    { title: "任务", dataIndex: "title", key: "title", render: (value: string, task) => <div><span className={styles.taskTitle}>{value}</span>{task.description && <div className={styles.description}>{task.description}</div>}</div> },
    { title: "状态", dataIndex: "status", key: "status", width: 120, render: (value: TaskStatus) => <Tag color={value === "done" ? "green" : value === "doing" ? "blue" : "default"}>{statusOptions.find(option => option.value === value)?.label ?? value}</Tag> },
    { title: "更新于", dataIndex: "updated_at", key: "updated_at", width: 190, render: (value: string) => value ? new Date(value).toLocaleString("zh-CN") : "—" },
    { title: "操作", key: "actions", width: 140, render: (_, task) => <Space><Button type="link" onClick={() => openTask(task)}>编辑</Button><Popconfirm title="删除这个任务？" onConfirm={() => void removeTask(task.id)}><Button type="link" danger>删除</Button></Popconfirm></Space> },
  ];

  return <div className={styles.page}>
    {toastContext}
    <div className={styles.heading}><div><h1>项目与任务</h1><p>把事情安排得井井有条。</p></div><span className={styles.projectCount}>{projects.length} 个项目</span></div>
    <div className={styles.layout}>
      <Card className={styles.sidebar} title="我的项目" extra={<Button size="small" onClick={() => openProject("new")}>＋ 新建项目</Button>}>
        {projectError && <Alert type="error" title={projectError} action={<Button size="small" onClick={() => void loadProjects()}>重试</Button>} showIcon />}
        <List loading={projectsLoading} dataSource={projects} locale={{ emptyText: <Empty description="还没有项目" /> }} renderItem={project =>
          <List.Item className={selectedId === project.id ? styles.activeProject : ""} onClick={() => { setSelectedId(project.id); setPage(1); }} actions={[
            <Button key="edit" type="text" size="small" onClick={event => { event.stopPropagation(); openProject(project); }}>编辑</Button>,
            <Popconfirm key="delete" title="删除项目及其任务？" onConfirm={() => void removeProject(project.id)}><Button type="text" danger size="small" onClick={event => event.stopPropagation()}>删除</Button></Popconfirm>,
          ]}><List.Item.Meta title={project.name} description={project.description || "暂无描述"} /></List.Item>
        } />
      </Card>
      <Card className={styles.tasks} title={<span>{selectedProject?.name ?? "任务"}<span className={styles.taskCount}> / {total} 条任务</span></span>} extra={selectedId !== null && <Button type="primary" size="small" onClick={() => openTask("new")}>＋ 新建任务</Button>}>
        {taskError && <Alert type="error" title={taskError} action={<Button size="small" onClick={() => selectedId !== null && void loadTasks(selectedId, page)}>重试</Button>} showIcon />}
        {selectedId === null ? <Empty description="选择或创建一个项目" /> : <Table rowKey="id" columns={columns} dataSource={tasks} loading={tasksLoading} scroll={{ x: 660 }} pagination={{ current: page, pageSize: 10, total, onChange: setPage, showTotal: count => `共 ${count} 条任务` }} />}
      </Card>
    </div>
    <Modal title={projectModal === "new" ? "新建项目" : "编辑项目"} open={projectModal !== null} onCancel={() => setProjectModal(null)} onOk={() => void saveProject()} confirmLoading={saving} destroyOnHidden>
      <Form form={projectForm} layout="vertical"><Form.Item name="name" label="项目名称" rules={[{ required: true, whitespace: true, message: "请输入项目名称" }]}><Input maxLength={100} /></Form.Item><Form.Item name="description" label="描述"><Input.TextArea rows={3} /></Form.Item></Form>
    </Modal>
    <Modal title={taskModal === "new" ? "新建任务" : "编辑任务"} open={taskModal !== null} onCancel={() => setTaskModal(null)} onOk={() => void saveTask()} confirmLoading={saving} destroyOnHidden>
      <Form form={taskForm} layout="vertical"><Form.Item name="title" label="任务标题" rules={[{ required: true, whitespace: true, message: "请输入任务标题" }]}><Input maxLength={200} /></Form.Item><Form.Item name="description" label="描述"><Input.TextArea rows={3} /></Form.Item>{taskModal !== "new" && <Form.Item name="status" label="状态"><Select options={statusOptions} /></Form.Item>}</Form>
    </Modal>
  </div>;
}

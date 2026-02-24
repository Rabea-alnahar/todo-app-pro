import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";
import { JwtAuthGuard } from "./auth/jwt.guard";
import { CurrentUser } from "./auth/current-user";

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  root() {
    return { ok: true, service: "todo-app-pro API" };
  }

  @Get("health")
  health() {
    return { ok: true };
  }

  // -------- Projects --------

  @UseGuards(JwtAuthGuard)
  @Get("projects")
  projects(@CurrentUser() user: { userId: string }) {
    return this.prisma.project.findMany({
      where: { ownerId: user.userId },
      orderBy: { createdAt: "desc" },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post("projects")
  createProject(
    @CurrentUser() user: { userId: string },
    @Body() body: { name: string }
  ) {
    return this.prisma.project.create({
      data: {
        name: body.name,
        ownerId: user.userId,
      },
    });
  }

  // -------- Todos (inside a Project) --------

  @UseGuards(JwtAuthGuard)
  @Get("projects/:projectId/todos")
  async listTodos(
    @CurrentUser() user: { userId: string },
    @Param("projectId") projectId: string
  ) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, ownerId: user.userId },
      select: { id: true },
    });
    if (!project) return { message: "Project not found" };

    return this.prisma.todo.findMany({
      where: { projectId },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post("projects/:projectId/todos")
  async createTodo(
    @CurrentUser() user: { userId: string },
    @Param("projectId") projectId: string,
    @Body() body: { title: string; description?: string; priority?: number }
  ) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, ownerId: user.userId },
      select: { id: true },
    });
    if (!project) return { message: "Project not found" };

    return this.prisma.todo.create({
      data: {
        title: body.title,
        description: body.description ?? null,
        priority: body.priority ?? 2,
        projectId,
      },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch("todos/:id")
  async updateTodo(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      status?: "OPEN" | "IN_PROGRESS" | "DONE";
      priority?: number;
      dueDate?: string;
    }
  ) {
    const todo = await this.prisma.todo.findFirst({
      where: { id, project: { ownerId: user.userId } },
      select: { id: true },
    });
    if (!todo) return { message: "Todo not found" };

    return this.prisma.todo.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        status: body.status as any,
        priority: body.priority,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        completedAt:
          body.status === "DONE"
            ? new Date()
            : body.status
            ? null
            : undefined,
      },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Delete("todos/:id")
  async deleteTodo(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string
  ) {
    const todo = await this.prisma.todo.findFirst({
      where: { id, project: { ownerId: user.userId } },
      select: { id: true },
    });
    if (!todo) return { message: "Todo not found" };

    await this.prisma.todo.delete({ where: { id } });
    return { ok: true };
  }
}
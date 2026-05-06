import { expect, test } from "@playwright/test"
import {
  firstAdmin,
  firstAdminPassword,
  firstManager,
  firstManagerPassword,
  firstMember,
  firstMemberPassword,
} from "./config.ts"
import { logInUser } from "./utils/user"

test.describe("RBAC navigation and route guards", () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test("admin can access users, user management, and metrics", async ({
    page,
  }) => {
    await logInUser(page, firstAdmin, firstAdminPassword)

    await expect(page.getByRole("link", { name: "Users" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Metrics" })).toBeVisible()

    await page.goto("/admin")
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible()
    await expect(
      page.getByText("Manage user accounts and permissions"),
    ).toBeVisible()
    await expect(page.getByRole("button", { name: "Add User" })).toBeVisible()
    await expect(
      page.getByRole("button", { name: "User actions" }).first(),
    ).toBeVisible()

    await page.goto("/metrics")
    await expect(page.getByRole("heading", { name: "Metrics" })).toBeVisible()
    await expect(page.getByText("User account totals")).toBeVisible()
    await expect(page.getByText("Active Users")).toBeVisible()
    await expect(page.getByText("Total Users")).toBeVisible()
  })

  test("manager can access users read-only and metrics", async ({ page }) => {
    await logInUser(page, firstManager, firstManagerPassword)

    await expect(page.getByRole("link", { name: "Users" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Metrics" })).toBeVisible()

    await page.goto("/admin")
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible()
    await expect(
      page.getByText("View user accounts and permissions"),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Add User" }),
    ).not.toBeVisible()
    await expect(
      page.getByRole("button", { name: "User actions" }),
    ).toHaveCount(0)

    await page.goto("/metrics")
    await expect(page.getByRole("heading", { name: "Metrics" })).toBeVisible()
    await expect(page.getByText("Active Users")).toBeVisible()
    await expect(page.getByText("Total Users")).toBeVisible()
  })

  test("member cannot access users or metrics", async ({ page }) => {
    await logInUser(page, firstMember, firstMemberPassword)

    await expect(page.getByRole("link", { name: "Users" })).not.toBeVisible()
    await expect(page.getByRole("link", { name: "Metrics" })).not.toBeVisible()

    await page.goto("/admin")
    await expect(page).toHaveURL("/")
    await expect(page.getByRole("heading", { name: "Users" })).not.toBeVisible()

    await page.goto("/metrics")
    await expect(page).toHaveURL("/")
    await expect(
      page.getByRole("heading", { name: "Metrics" }),
    ).not.toBeVisible()
  })
})

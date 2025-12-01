// Page configuration utility

// List of paths that should have header and footer hidden
export const pagesWithHiddenHeaderFooter = ["/admin/products", "/admin/ingredients", "/admin/printSettings", "/admin/printFrontLabel", "/admin/printBackLabel", "/demo/menu", "/demo/products", "/demo/ingredients", "/demo/printSettings", "/demo/printFrontLabel", "/demo/printBackLabel", "/login", "/register", "/resetPassword", "/forgotPassword"];

/**
 * Check if the current path should have header and footer hidden
 * @param path Current page path
 * @returns Boolean indicating if header and footer should be hidden
 */
export function shouldHideHeaderFooter(path: string): boolean {
    // Check if the path exactly matches or starts with any of the paths in the list
    return pagesWithHiddenHeaderFooter.some(hiddenPath => path === hiddenPath || path.startsWith(`${hiddenPath}/`));
}

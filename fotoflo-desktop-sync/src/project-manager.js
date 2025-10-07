import fetch from 'node-fetch';
import chalk from 'chalk';

export function createProjectManager(serverUrl) {
  return {
    async getProjects() {
      try {
        const response = await fetch(`${serverUrl}/api/projects`);
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication required. Please log in to Fotoflo web app first.');
          }
          throw new Error(`Failed to fetch projects: ${response.status}`);
        }
        
        const projects = await response.json();
        return projects.map(project => ({
          id: project.id,
          name: project.name,
          display_mode: project.display_mode || 'single',
          created_at: project.created_at
        }));
        
      } catch (error) {
        console.error(chalk.red('❌ Failed to fetch projects:'), error.message);
        throw error;
      }
    },

    async validateProject(projectId) {
      try {
        const response = await fetch(`${serverUrl}/api/projects/${projectId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Project not found');
          }
          if (response.status === 401) {
            throw new Error('Authentication required');
          }
          throw new Error(`Failed to validate project: ${response.status}`);
        }
        
        const project = await response.json();
        return {
          id: project.id,
          name: project.name,
          display_mode: project.display_mode || 'single',
          valid: true
        };
        
      } catch (error) {
        console.error(chalk.red('❌ Project validation failed:'), error.message);
        throw error;
      }
    },

    async testConnection() {
      try {
        const response = await fetch(`${serverUrl}/api/health`, {
          timeout: 5000
        });
        
        if (response.ok) {
          return { connected: true, message: 'Connection successful' };
        } else {
          return { connected: false, message: `Server returned ${response.status}` };
        }
        
      } catch (error) {
        return { connected: false, message: error.message };
      }
    }
  };
}

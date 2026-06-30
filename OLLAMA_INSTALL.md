# Guide d'Installation et Configuration d'Ollama

Ce guide vous explique comment installer Ollama et configurer le modèle financier spécifique pour le projet TechCorp.

## 1. Installation d'Ollama

1.  Rendez-vous sur [ollama.com](https://ollama.com/download).
2.  Téléchargez la version correspondant à votre système d'exploitation (Windows, macOS ou Linux).
3.  Lancez l'installateur et suivez les instructions.
4.  Une fois installé, vérifiez qu'Ollama fonctionne en ouvrant un terminal et en tapant :
    ```bash
    ollama --version
    ```

## 2. Téléchargement du modèle de base

Le projet utilise le modèle **Phi-3.5**. Vous devez le télécharger initialement :
```bash
ollama pull phi3.5
```

## 3. Configuration du modèle Financier TechCorp

Le projet contient un fichier `Modelfile` (dans `src/ollama_server/`) qui contient les instructions métier (System Prompt, Température, etc.).

1.  Ouvrez un terminal dans le dossier du projet :
    ```bash
    cd src/ollama_server/
    ```
2.  Créez le modèle personnalisé en utilisant le Modelfile :
    ```bash
    ollama create phi3.5 -f Modelfile
    ```

## 4. Vérification

Vérifiez que le modèle est bien présent dans votre liste locale :
```bash
ollama list
```
Vous devriez voir `phi3.5` dans la liste.

## 5. Lancement

Ollama tourne normalement en arrière-plan. Si ce n'est pas le cas, vous pouvez le lancer manuellement, mais l'application TechCorp s'y connectera automatiquement via `http://localhost:11434`.

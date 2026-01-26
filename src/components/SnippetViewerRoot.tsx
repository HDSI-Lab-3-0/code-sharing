import Provider from "./Provider";
import SnippetViewer from "./SnippetViewer";

export default function SnippetViewerRoot({ publicId }: { publicId: string }) {
    return (
        <Provider>
            <SnippetViewer publicId={publicId} />
        </Provider>
    );
}

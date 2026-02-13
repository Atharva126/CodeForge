import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { ReactNode } from 'react';

interface SplitPaneProps {
    left: ReactNode;
    right: ReactNode;
    minLeftSize?: number;
    minRightSize?: number;
}

export default function SplitPane({ left, right, minLeftSize = 25, minRightSize = 25 }: SplitPaneProps) {
    return (
        <PanelGroup direction="horizontal" className="h-full bg-gray-950">
            <Panel defaultSize={40} minSize={minLeftSize} className="bg-gray-900 border-r border-gray-800">
                <div className="h-full overflow-hidden flex flex-col">
                    {left}
                </div>
            </Panel>

            <PanelResizeHandle className="w-1.5 bg-gray-900 hover:bg-blue-600 transition-colors cursor-col-resize flex items-center justify-center group z-10">
                <div className="h-8 w-1 rounded-full bg-gray-700 group-hover:bg-white transition-colors" />
            </PanelResizeHandle>

            <Panel defaultSize={60} minSize={minRightSize} className="bg-gray-900">
                <div className="h-full overflow-hidden flex flex-col">
                    {right}
                </div>
            </Panel>
        </PanelGroup>
    );
}

import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import * as strings from 'ChatFinWebPartStrings';
import ChatFin from './components/ChatFin';
import { IChatFinProps } from './components/IChatFinProps';

export interface IChatFinWebPartProps {
  webhookUrl: string;
  title: string;
  placeholder: string;
}

export default class ChatFinWebPart extends BaseClientSideWebPart<IChatFinWebPartProps> {
  public render(): void {
    const element: React.ReactElement<IChatFinProps> = React.createElement(ChatFin, {
      webhookUrl: this.properties.webhookUrl,
      title: this.properties.title,
      placeholder: this.properties.placeholder
    });

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: strings.PropertyPaneDescription },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('webhookUrl', {
                  label: 'Webhook URL (n8n)'
                }),
                PropertyPaneTextField('title', { label: 'Título' }),
                PropertyPaneTextField('placeholder', { label: 'Placeholder do input' })
              ]
            }
          ]
        }
      ]
    };
  }
}
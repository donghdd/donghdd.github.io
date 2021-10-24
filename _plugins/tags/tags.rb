
module Jekyll
    # tooltip tag
    class RenderTooltipTag < Liquid::Tag
      Syntax = /^(.+)\[(.+)\]/
      def initialize(tag_name, markup, tokens)
        super
        if markup =~ Syntax then
          @tooltip = $1
          @tooltipText = $2
        else
            raise "[Tooltip Tag] Syntax not match!"
        end
      end
      def render(context)
        "<span class=\"tooltip\">#{@tooltip}<span class=\"tooltiptext\">#{@tooltipText}</span></span>"
      end
    end

    # mp3 tag
    class RenderMp3Tag < Liquid::Tag
      Syntax = /^([^\s]+.mp3)/
      def initialize(tag_name, markup, tokens)
        super
        if markup =~ Syntax then
            @mp3url = $1
        else
            raise "[Mp3 Tag] Syntax not match!"
        end
      end
      def render(context)
        "<audio controls=\"\"><source src=\"#{@mp3url}\" type=\"audio/mpeg\">Your browser does not support the audio element.</audio>"
      end
    end

    # image tag
    class RenderImageTag < Liquid::Tag
      Syntax = /^([^\s]+)\s+(.+)/
      def initialize(tag_name, markup, tokens)
        super
        if markup =~ Syntax then
            @url = $1
            @text = $2
        else
            raise "[image Tag] Syntax not match!"
        end
      end
      def render(context)
        "<img src=\"#{@url}\" title=\"#{@text}\" class=\"w3-image cursor-zoom\" onclick=\"onZoomImg(this)\">"
      end
    end
    
    # link tag
    class RenderLinkTag < Liquid::Tag
        Syntax = /^(in|out|anchor)\s+([^\s]+)\s+(.+)/
        def initialize(tag_name, markup, tokens)
          super
          if markup =~ Syntax then
              @url = $2
              @text = $3
              @klazz = "hvr-forward"
              @rel = $1 == "out" ? "rel=\"nofollow\"" : ""
              @anchor = $1 == "anchor" ? "" : "target=\"_blank\""
          else
              raise "[link Tage] Syntax not match!"
          end
        end
        def render(context)
          "<a href=\"#{@url}\" class=\"#{@klazz}\" #{@rel} #{@anchor}>#{@text}</a>"
        end
    end
    
    # msg tag
    class RenderMsgTag < Liquid::Tag
        Syntax = /^(success|warning|info|danger)\s+(.+)/
        def initialize(tag_name, markup, tokens)
          super
          if markup =~ Syntax then
              case $1
              when "success"
                @openDiv = "<div class=\"w3-card w3-leftbar w3-border-green w3-pale-green w3-panel w3-padding-16\">"
              when "warning"
                @openDiv = "<div class=\"w3-card w3-leftbar w3-border-yellow w3-pale-yellow w3-panel w3-padding-16\">"
              when "info"
                @openDiv = "<div class=\"w3-card w3-leftbar w3-border-blue w3-pale-blue w3-panel w3-padding-16\">"
              when "danger"
                @openDiv = "<div class=\"w3-card w3-leftbar w3-border-red w3-pale-red w3-panel w3-padding-16\">"
              else
                raise "Please indicate success/warning/info/danger"
              end

              @text = $2
          else
              raise "[msg Tag] Syntax not match!"
          end
        end
        def render(context)
            "#{@openDiv}#{@text}</div>"
        end
    end

    # Underline tag
    class RenderUnderlineTag < Liquid::Tag
      Syntax = /^(.+)/
      def initialize(tag_name, markup, tokens)
        super
        if markup =~ Syntax then
            @text = $1
        else
            raise "[Underline Tag] Syntax not match!"
        end
      end
      def render(context)
        "<u>#{@text}</u>"
      end
    end

    # Strong tag
    class RenderStrongTag < Liquid::Tag
      Syntax = /^(.+)/
      def initialize(tag_name, markup, tokens)
        super
        if markup =~ Syntax then
            @text = $1
        else
            raise "[Strong Tag] Syntax not match!"
        end
      end
      def render(context)
        "<strong>#{@text}</strong>"
      end
    end

    # highlighted text
    class RenderHighlightTag < Liquid::Tag
      Syntax = /^(.+)/
      def initialize(tag_name, markup, tokens)
        super
        if markup =~ Syntax then
            @text = $1
        else
            raise "[Highlight Tag] Syntax not match!"
        end
      end
      def render(context)
        "<mark>#{@text}</mark>"
      end
    end
end
  
Liquid::Template.register_tag('img', Jekyll::RenderImageTag)
Liquid::Template.register_tag('mp3', Jekyll::RenderMp3Tag)
Liquid::Template.register_tag('tooltip', Jekyll::RenderTooltipTag)
Liquid::Template.register_tag('a', Jekyll::RenderLinkTag)
Liquid::Template.register_tag('msg', Jekyll::RenderMsgTag)
Liquid::Template.register_tag('u', Jekyll::RenderUnderlineTag)
Liquid::Template.register_tag('strong', Jekyll::RenderStrongTag)
Liquid::Template.register_tag('mark', Jekyll::RenderHighlightTag)
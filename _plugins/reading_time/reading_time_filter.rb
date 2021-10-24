# Usage: Read this in about {{ page.content | reading_time }}
module ReadingTimeFilter
    def reading_time( input )
        words = input.split.size
        words_per_minute = 180
        minutes = ( words / words_per_minute ).floor
        words < 360 ? "1 min read" : "#{minutes} mins read"
    end
end
  
Liquid::Template.register_filter(ReadingTimeFilter)